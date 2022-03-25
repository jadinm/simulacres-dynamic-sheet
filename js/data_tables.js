table_instance_by_prefix = {}

class DataRow extends Model {
    static row_id_regex = /((\w+|limitedUse-equipment|magical-equipment)-(x|\d+))-?(.*)/

    constructor(data, opts = {}, other_html = null) {
        super(opts, other_html, data)
    }

    prepare(data) {
        super.prepare(data)
        this.data = $(data)
        this.id = this.data[0].id
        const match = this.id.match(this.constructor.row_id_regex)
        this.row_index = match[1]
        this.row_number = match[3]
    }

    add_listeners() {
        // We ignore template rows
        if (!this.is_template())
            super.add_listeners()
    }

    write() {
        // We ignore template rows
        if (!this.is_template())
            super.write()
    }

    is_template() {
        return this.row_number === "x"
    }

    find(selector) {
        return this.data.find(selector)
    }

    full_id(base_id) {
        return this.row_index + "-" + base_id
    }

    local_id(base_id) {
        return base_id.replace(this.row_index + "-", "")
    }

    button_from_event(event, class_name = "row-roll-trigger") {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass(class_name))
            button = $(event.target).parents("." + class_name)
        return button
    }

    update_roll_value() {
    }

    search(value) {
        let found = false
        this.find("input, select").each((i, elem) => {
            const val = $(elem).val()
            if (val && typeof val === "string" && val.toLowerCase().includes(value)) {
                found = true
            }
        })
        return found
    }
}

class DataList {
    static row_class = DataRow

    constructor(table, opts, other_html = null) {
        this.table = table
        this.rows = []
        this.other_html = other_html
        if (this.table.length === 0)
            return
        this.id = this.table[0].id
        if (this.id === undefined)
            return // Invalid data list
        this.setup_table_ids()
        this.register()

        // Remove any tooltip on the template because it will fail upon cloning
        if (this.template_row)
            this.template_row.find("[data-toggle=\"tooltip\"]").tooltip("dispose")

        this.update_rows(opts)

        // Add listeners if we are in the main document
        if (this.other_html === null) {
            this.setup_sortable()
            this.add_custom_listeners()
        }
    }

    setup_table_ids() {
        this.name = this.id.replace("-table", "")
        this.template_row = this.construct_row(this.get(this.name + "-x"), {}, this.other_html)
        this.add_button = this.get("add-" + this.name)
        this.remove_button = this.get(this.id + "-remove")
    }

    setup_sortable() {
        this.table.sortable({
            handle: '.fa-arrows-alt',
            dragoverBubble: true,
            group: this.id,
            onEnd: _ => {
                changed_page = true
            }
        })
        this.add_button.on("click", (event, idx = null) => { // Add parameter for forced index
            this.add_row(idx)
            changed_page = true
        })
        this.remove_button.sortable({
            group: this.id, // So that it can delete the appropriate table items
            ghostClass: "remove-drop",
            handle: '.fa-arrows-alt', // So that the button itself cannot be moved
            onAdd: e => this.remove_row(e)
        })
    }

    get(id) {
        // The first form works for all e cases but the latter is more efficient
        return this.other_html ? this.table.find("#" + id) : $("#" + id)
    }

    get_row(row_element_id) {
        const base_id = row_element_id.match(this.constructor.row_class.row_id_regex)[1]
        if (this.template_row.id === base_id)
            return this.template_row
        for (let i = 0; i < this.rows.length; i++) {
            if (this.rows[i].id === base_id) {
                return this.rows[i]
            }
        }
        return null
    }

    get_rows(include_template = false) {
        return this.template_row && include_template ? [this.template_row, ...this.rows] : this.rows
    }

    register() {
        table_instance_by_prefix[this.name] = this
    }

    construct_row(elem, opts) {
        return new this.constructor.row_class(elem, opts, this.other_html)
    }

    update_rows(opts) {
        let next_i = 0
        this.children().each((_, elem) => { // Sync existing children
            if (this.template_row && elem.id === this.template_row.id)
                return
            const row = this.construct_row(elem, opts && opts.rows ? opts.rows[next_i] : {})
            if (this.other_html === null) {
                this.add_custom_listener_to_row(row)
            }
            this.rows.push(row)
            next_i += 1
        })
        if (opts && opts.rows) {
            for (let i = next_i; i < opts.rows.length; i++) {
                this.add_row(null, opts.rows[i])
            }
        }
    }

    write() {
        for (let i = 0; i < this.rows.length; i++) {
            this.rows[i].write()
        }
    }

    children() {
        return this.table.children()
    }

    import(opts) {
        let next_i = 0
        this.children().each((_, elem) => {
            const row = this.get_row(elem.id)
            if (!row.is_template() && opts && opts.rows && opts.rows[next_i]) {
                row.import(opts.rows[next_i]) // Only update when there is data to change it
                next_i += 1
            }
        })
        if (opts && opts.rows) {
            for (let i = next_i; i < opts.rows.length; i++) {
                this.add_row(null, {}).import(opts.rows[i])
            }
            // too many rows in the sheet: delete them (can happen if rows were removed in the local storage)
            if (this.rows.length > opts.rows.length) {
                this.children().each((i, elem) => {
                    if (i - 1 >= opts.rows.length) { // i - 1 means that we don't take template row
                        this.remove_row({item: elem})
                    }
                })
            }
        }
    }

    export() {
        const to_export = {
            rows: []
        }
        // Re-read the DOM to update the ordering
        // Note: this is also a sanity check to verify that for each children there is a DataRow
        this.children().each((i, elem) => {
            const row = this.get_row(elem.id)
            if (!row.is_template())
                to_export.rows.push(row.export())
        })
        return to_export
    }

    add_custom_listener_to_row(row) {
        /* Copy row */
        row.get("copy").on("click", (e) => this.copy_row(e))
    }

    add_custom_listeners() {
        this.rows.forEach(elem => {
            this.add_custom_listener_to_row(elem)
        })
    }

    clone_row() {
        return this.template_row.data.clone(true, true)
    }

    copy_row(event) {
        let button = $(event.target)
        if (!button.hasClass("row-copy")) {
            button = button.parents(".row-copy")
        }
        this.add_row(null, this.get_row(button[0].id).export())
        changed_page = true
    }

    add_row(fixed_idx = null, from_row_opts = {}) {
        const new_elem = this.clone_row()

        let new_id
        if (fixed_idx === null) {
            // Increment the spell id
            let max_tr_id = -1
            this.children().each((i, elem) => {
                let old_value = elem.id.split("-").pop()
                if (old_value === "x")
                    old_value = "-1"
                max_tr_id = Math.max(parseInt(old_value) || 0, max_tr_id)
            })
            new_id = max_tr_id + 1
        } else {
            // Use requested idx
            new_id = fixed_idx
        }

        // Replace all '-x-' in the attributes of the new row
        $.each(["id", "name", "for", "data-slider-id", "aria-labelledby", "data-target", "aria-controls"], (i, attr) => {
            new_elem.find("*[" + attr + "*=-x-]").each((i, elem) => {
                elem.setAttribute(attr, elem.getAttribute(attr).replace("-x-", "-" + new_id + "-"))
            })
        })
        new_elem[0].id = new_elem[0].id.replace("-x", "-" + new_id)
        new_elem.removeAttr("hidden")
        this.table.append(new_elem)

        // Copy data from one row to the other
        const row = this.construct_row(new_elem, from_row_opts, this.other_html)
        this.rows.push(row)
        if (Object.keys(from_row_opts).length > 0)
            row.write() // Overwrite DOM

        // Add custom listeners
        if (this.other_html === null) {
            this.add_custom_listener_to_row(row)
        }
        return row
    }

    remove_row(event) {
        // Remove the element and potential tooltips
        const tooltip_sel = "[data-toggle='tooltip']:visible"
        $(event.item).find(tooltip_sel).tooltip("dispose")
        $(event.item).filter(tooltip_sel).tooltip("dispose")

        this.rows = this.rows.filter(item => item.id !== event.item.id)
        $(event.item).remove()
        changed_page = true
    }
}

function toggle_table() {
    const table_selector = this.getAttribute("data-hide-table")
    const row_selector = this.getAttribute("data-hide-row")
    const table_frame = (table_selector) ? $(table_selector).parents(".table-responsive,.collapsible-table") : $(row_selector)
    const svg = $(this).children("svg.svg-inline--fa").first()
    if (!table_frame.hasClass("d-none")) {
        table_frame.addClass("d-none")
        table_frame.prev().addClass("d-none")
        table_frame.prev().prev("hr").addClass("d-none")
        table_frame.next().addClass("d-none")
        svg.addClass("fa-eye-slash").removeClass("fa-eye")
        $(this).addClass("btn-dark").removeClass("btn-light")
    } else {
        table_frame.removeClass("d-none")
        table_frame.prev().removeClass("d-none")
        table_frame.prev().prev("hr").removeClass("d-none")
        table_frame.next().removeClass("d-none")
        svg.removeClass("fa-eye-slash").addClass("fa-eye")
        $(this).removeClass("btn-dark").addClass("btn-light")
    }
}

$(".hide-section").uon("click", toggle_table)

/**
 * Get a table instance of the row of the element in parameter
 * @param row_element != null and it must be either a jquery object or a html element
 * @returns {*} a table object instance
 */
function table_of(row_element) {
    const match = $(row_element)[0].id.match(DataRow.row_id_regex)
    return match ? table_instance_by_prefix[match[2]] : null
}

/**
 * Get a row instance of the row of the element in parameter
 * @param row_element != null and it must be either a jquery object or a html element
 * @returns {*} a row object instance
 */
function row_of(row_element) {
    const table = table_of(row_element)
    return table ? table_of(row_element).get_row($(row_element)[0].id) : null
}

function search_tables(value, selector) {
    selector.each((i, elem) => {
        if (!elem.id.includes("-x")) {
            const row = row_of(elem)
            if (value.length === 0 || row.search(value)) {
                $(elem).removeClass("d-none")
            } else {
                $(elem).addClass("d-none")
            }
        }
    })
}
