/* This file handles the talent lists */

class Talent extends DataRow {
    static row_id_regex = /(?:talent_)?((x|-4|-2|0|1)(\d*))-?(.*)/
    static basic_inputs = ["name"]

    constructor(current_list, data, opts = {}, other_html = null, created = true) {
        super(data, opts, other_html, created)
        this.current_list = current_list
    }

    prepare(data) {
        super.prepare(data)
        const match = this.id.match(this.constructor.row_id_regex)
        this.base_level = match[2]
        this.old_cost = null
    }

    is_template() {
        return this.row_number.length === 0
    }

    talent_level(target_list = null) {
        return (target_list) ? target_list.list_level : this.current_list.list_level
    }

    talent_cost(list = null) {
        const current_value = this.talent_level(list)
        let old_value = this.base_level

        if (sheet["ap"].work_talents().includes(this.name)) {
            // Check that it is not a work talent
            old_value = "0" // Compute PA cost from level 0
        }
        if (sheet["ap"].main_work_talents().includes(this.name)) {
            // Check that it is not the main work talent
            old_value = "1" // Compute PA cost from level 1
        }

        let original_cost = talent_increment_cost[old_value][current_value]
        let cost = original_cost

        if (sheet["ap"].talent_x_inefficient_raise().includes(this.name) && parseInt(current_value) >= 0) {
            // 6 PA were consumed to raise this talent from X to 0 instead of 5
            cost += indirect_x_to_0_raise_cost
        }

        if (sheet["ap"].advised_talent().includes(this.name))
            cost = Math.max(0, cost - advised_talent_save)
        return [cost, original_cost]
    }

    update_talent_tooltip(target_list = null) {
        const current_level = this.talent_level(target_list)
        const old_level = this.base_level
        if (current_level !== old_level) {
            const [cost, cost_without_reductions] = this.talent_cost(target_list)
            if (cost === this.old_cost && cost_without_reductions === this.old_cost_without_reductions)
                return // Tooltip still valid
            if (!isNaN(cost)) {
                if (!intermediate_discovery) {
                    this.data.attr("data-original-title",
                        "Talent " + old_level.toUpperCase() + " à la base <br />" + "Coût: " + cost + " PA")
                    this.find(".talent-origin").text("< " + old_level.toUpperCase())
                    this.data.addClass("increased-talent")
                }
            } else {
                this.data.attr("data-original-title",
                    "Talent " + old_level.toUpperCase() + " à la base <br />" + "Mouvement invalide")
                this.find(".talent-origin").text("< " + old_level.toUpperCase() + " (Mouvement invalide)")
            }
            this.data.tooltip({disabled: false})
            this.old_cost = cost
            this.old_cost_without_reductions = cost_without_reductions
        } else {
            this.data.attr("data-original-title", "")
            if (!intermediate_discovery) {
                this.data.removeClass("increased-talent").tooltip({disabled: true})
            }
            this.find(".talent-origin").text("")
            this.old_cost = 0
        }
    }

    update_talent(list) {
        if (list === this.current_list)
            return // No change of list
        this.current_list.rows = this.current_list.rows.filter((talent) => talent.id !== this.id)
        list.rows.push(this)
        this.current_list = list
        this.update_talent_tooltip(list)

        // Update all list selections of talents that are changed when a talent level is changed
        $("select.talent-select[data-talent-filter-current-level]").each((i, elem) => {
            update_talent_select($(elem))
        })

        // Update related rolls
        sheet.get_all_rolls_with_talent(this).forEach((elem) => {
            elem.update_roll_value()
        })

        // Update Adventure points
        compute_remaining_ap()

        changed_page = true
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template()) {
            this.get("name").on("change", (e, bulk = false) => {
                // Update all list selections of talents while changing the selection value if the changed talent was selected

                if (!bulk) {
                    $("select.talent-select").each((i, elem) => {
                        update_talent_select($(elem), e.target.value, e.target.oldvalue)
                    })
                    e.target.oldvalue = null
                }
            }).on("focus", e => {
                e.target.oldvalue = e.target.value
            })
        }
    }

    export() {
        const to_export = super.export()
        to_export["current_level"] = this.current_list.list_level
        to_export["base_level"] = this.base_level
        return to_export
    }
}

class TalentLists extends DataList {
    static talent_tables = [
        "talents_x", "talents_-4", "talents_-2", "talents_0", "talents_1", "talents_2", "talents_3"
    ]

    static talent_table_updated = false

    static row_class = Talent

    constructor(table, opts, other_html = null) {
        super(table, opts, other_html)
        if (this.id === undefined)
            return // Table absent
        this.list_level = this.id.split("_")[1]
        if (this.list_level === "3") {
            // Need to have all the talents initialized before checking for the missing ones
            this.constructor.add_missing_talents(default_talents)
        }
    }

    setup_table_ids() {
        this.name = this.id
        this.list_level = this.id.split("_")[1]
        const template_div = this.get(this.name.replace("talents", "talent"))
        this.template_row = template_div.length > 0 ? this.construct_row(template_div, {}, false) : null
        this.add_button = this.get("add-talent-" + this.list_level)
        this.remove_button = this.table.parent().find(".remove-talent")
    }

    setup_sortable() {
        this.table.sortable({
            handle: '.fa-arrows-alt',
            group: 'talent-lists', // So we can move the talent around
            dragoverBubble: true,
            onEnd: (e) => {
                if (!$(e.to).hasClass("remove-talent")) {
                    const new_list = sheet.get_talent_list(e.to.id)
                    const talent = this.get_row(e.item.id)
                    talent.update_talent(new_list)
                }
                changed_page = true
            },
            onMove: (e, _) => {
                // Prevent moves that have an invalid PA cost
                const new_list = sheet.get_talent_list(e.to.id)
                const talent = this.get_row(e.dragged.id)
                if (!$(e.to).hasClass("remove-talent") && isNaN(talent.talent_cost(new_list)[0])) {
                    return false
                }
                return e.willInsertAfter ? 1 : -1
            }
        })
        this.add_button.on("click", (event, idx = null) => { // Add parameter for forced index
            this.add_row(idx)
            changed_page = true
        })

        this.remove_button.sortable({
            group: 'talent-lists', // So that it can delete those items
            ghostClass: "remove-drop",
            handle: '.fa-arrows-alt', // So that the button itself cannot be moved
            onAdd: event => this.remove_row(event)
        })
    }

    children() {
        return this.table.children().slice(1)
    }

    get_row(row_element_id) {
        const base_id = "talent_" + row_element_id.match(this.constructor.row_class.row_id_regex)[1]
        if (this.template_row && this.template_row.id === base_id)
            return this.template_row
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].id === base_id) {
                return this.rows[i]
            }
        }
        return sheet.get_talent_from_id(base_id)
    }

    construct_row(elem, opts, just_added) { // (this, new_talent, opts, this.other_html)
        return new this.constructor.row_class(this, elem, opts, this.other_html, just_added)
    }

    remove_row(event) {
        const row = this.get_row(event.item.id)
        super.remove_row(event)
        // Update rolls
        sheet.get_all_rolls_with_talent(row).forEach((elem) => {
            elem.update_roll_value()
        })

        // Update all list selections of talents
        $("select.talent-select").each((i, elem) => {
            update_talent_select($(elem))
        })
    }

    add_row(fixed_id = null, opts = {}) {
        const initial_level = this.list_level

        // Find new id
        let new_id_idx = 0
        if (fixed_id === null) {
            while ($("#talent_" + initial_level + new_id_idx).length > 0)
                new_id_idx++
        } else {
            new_id_idx = fixed_id
        }

        // Clone and set ids
        const new_talent = this.template_row.data.clone(true, true)
        new_talent[0].id = "talent_" + initial_level + new_id_idx
        const input = $(new_talent).find("input")
        input[0].id = initial_level + new_id_idx + "-name"
        input[0].value = ""
        input[0].setAttribute("value", "")
        const label = $(new_talent).find("label")[0]
        label.for = initial_level + new_id_idx + "-name"
        $(new_talent).removeAttr("hidden")
        $(new_talent).attr("data-toggle", "tooltip")
        $(new_talent).tooltip()

        this.children().last().before(new_talent)

        const row = this.construct_row(new_talent, opts, true)
        row.update_talent_tooltip()
        this.rows.push(row)

        // Add custom listeners
        if (this.other_html === null) {
            this.add_custom_listener_to_row(row)
        }
        return row
    }

    static add_missing_talents(default_talents) {
        let updated = false
        for (const [level, talents] of Object.entries(default_talents)) {
            for (const talent of talents) {
                if (!sheet.get_talent_from_name(talent)) {
                    // Need to add it, but telling the Talent not to trigger update of all the select pickers
                    sheet.get_talent_list("talents_" + level).add_row(null).get("name").val(talent).trigger("change", true)
                    updated = true
                }
            }
        }
        if (updated) {
            // Update all list selections of talents if needed
            $("select.talent-select").each((i, elem) => {
                update_talent_select($(elem))
            })
        }
    }

    get_talent_from_name(name) {
        const res = this.rows.filter((talent) => talent.name === name)
        if (res.length === 0)
            return null
        return res[0]
    }

    /**
     * Import talents that might initially be from another list
     * table_opts: The part of the data exported by this table
     * full_opts: The complete dictionary given to the sheet
     */
    import(table_opts, full_opts) {
        // Creating talents that originate from this talent list, even if they were moved to another list
        this.constructor.talent_tables.forEach((name) => {
            for (const talent_desc of full_opts[name].rows) {
                if (talent_desc["base_level"] === this.list_level && !sheet.get_talent_from_name(talent_desc["name"])) {
                    // This talent needs to be created here (it will be moved later)
                    this.add_row(null, {}).import(talent_desc)
                    this.constructor.talent_table_updated = true
                }
            }
        })

        // Since talent lists are imported in increasing order of level, we know that talents that should be moved
        // in this list are already created (because moves to the lower levels are forbidden)
        for (const talent_desc of table_opts.rows) {
            const talent = sheet.get_talent_from_name(talent_desc["name"])
            // Move the talent on the other list (or don't move if not needed)
            if (this === talent.current_list) {
                talent.update_talent_tooltip() // potentially updating the tooltip if the it was moved
            } else {
                talent.update_talent(this)
                this.constructor.talent_table_updated = true
            }
            this.table.append(talent.data) // Moves the element to the end of the list
        }

        if (sheet[this.constructor.talent_tables[this.constructor.talent_tables.length - 1]] === this && this.constructor.talent_table_updated) {
            // This was the last talent list to update: this is time to update all the talent select pickers
            $("select.talent-select").each((i, elem) => {
                update_talent_select($(elem))
            })
            this.constructor.talent_table_updated = false
        }
    }

    static update_talent_tooltip_resize(size) {
        if (!sheet)
            return
        // We need template rows so that new elements are built correctly
        const small_sizes = ["xs", "sm", "md"]
        if (small_sizes.includes(bootstrap_previous_size) ^ small_sizes.includes(size) || !bootstrap_previous_size) { // There is a switch to do
            sheet.talents(true).forEach((elem) => {
                if (small_sizes.includes(size)) {
                    // Only triggered when clicking on the input
                    // Otherwise, the tooltip hides the handler, making it impossible to move around
                    elem.data.attr("data-trigger", "focus")
                    if (!elem.is_template())
                        elem.data.tooltip('dispose').tooltip({trigger: "focus"})
                } else {
                    elem.data.attr("data-trigger", "hover focus")
                    if (!elem.is_template())
                        elem.data.tooltip('dispose').tooltip({trigger: "hover focus"})
                }
            })
        }
    }
}

$("#talent-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    $(".talent input").each((i, elem) => {
        if (!elem.getAttribute("hidden")) {
            const content = $(elem).val().toLowerCase()
            if (content.includes(value)) {
                $(elem).parents(".talent").removeClass("d-none")
            } else {
                $(elem).parents(".talent").addClass("d-none")
            }
        }
    })
})
