const row_id_regex = /((\w+|limitedUse-equipment|magical-equipment)-(x|\d+))-?(.*)/

row_classes_by_prefix = {}

class DataRow {

    constructor(data) {
        this.data = $(data)
        this.id = this.data[0].id
        this.row_index = this.data[0].id.match(row_id_regex)[1]
    }

    get(element_id_suffix) {
        return $("#" + this.row_index + "-" + element_id_suffix)
    }

    update_roll_value() {
    }

    search(value) {
        let found = false
        this.data.find("input, select").each((i, elem) => {
            const val = $(elem).val()
            if (val && typeof val === "string" && val.toLowerCase().includes(value)) {
                found = true
            }
        })
        return found
    }

    static of(base_elem) {
        const base_id = $(base_elem)[0].id.match(row_id_regex)[1]
        return new this.prototype.constructor($("#" + base_id))
    }
}

class DataTable {
    static row_class = DataRow

    constructor(table) {
        this.table = $(table)
        if (this.table.length === 0)
            return
        this.id = this.table[0].id
        this.name = this.id.replace("-table", "")

        this.template_row = $("#" + this.name + "-x")
        this.add_button = $("#add-" + this.name)
        this.remove_button = $("#" + this.id + "-remove")

        // Add listeners
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
        })
        this.remove_button.sortable({
            group: this.id, // So that it can delete the appropriate table items
            ghostClass: "remove-drop",
            onAdd: this.remove_row
        })
        this.add_custom_listeners()
        this.register()
    }

    register() {
        row_classes_by_prefix[this.name] = this.constructor.row_class
    }

    is_template_row(row) {
        return $(row)[0].id === this.template_row[0].id
    }

    add_custom_listener_to_row(row) {
    }

    add_custom_listeners() {
        this.table.children().each((i, elem) => {
            if (!this.is_template_row(elem)) {
                this.add_custom_listener_to_row(new this.constructor.row_class(elem))
            }
        })
    }

    clone_row() {
        return this.template_row.clone(true, true)
    }

    add_row(fixed_idx = null) {
        const new_elem = this.clone_row()

        let new_id
        if (fixed_idx === null) {
            // Increment the spell id
            let max_tr_id = -1
            this.table.children().each((i, elem) => {
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
        this.table.append(new_elem)
        new_elem.removeAttr("hidden")

        // Add custom listeners
        const row = new this.constructor.row_class(new_elem)
        this.add_custom_listener_to_row(row)
        return row
    }

    remove_row(event) {
        // Remove the element and potential tooltips
        const tooltip_sel = "[data-toggle='tooltip']:visible"
        $(event.item).find(tooltip_sel).tooltip("dispose")
        $(event.item).filter(tooltip_sel).tooltip("dispose")

        $(event.item).remove()
        changed_page = true
    }
}

class RuneTable extends DataTable {

    add_row(fixed_idx = null) {
        super.add_row(fixed_idx)
        compute_remaining_ap() // Each rune cost AP
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.get("name").uon("change", compute_remaining_ap)
    }
}

class WordTable extends RuneTable {

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.get("type").uon("changed.bs.select", compute_remaining_ap)
        row.get("type").selectpicker()
    }
}

function toggle_table() {
    const table_selector = this.getAttribute("data-hide-table")
    const row_selector = this.getAttribute("data-hide-row")
    const table_frame = (table_selector) ? $(table_selector).parents(".table-responsive") : $(row_selector)
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
 * Get a row instance of the row of the element in parameter
 * @param row_element != null and it must be either a jquery object or a html element
 * @returns {*} a row object instance
 */
function row_of(row_element) {
    const prefix = $(row_element)[0].id.match(row_id_regex)[2]
    const row_class = (prefix in row_classes_by_prefix) ? row_classes_by_prefix[prefix] : DataRow
    return row_class.of(row_element)
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

$("#equipment-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#focus-table tr,#magical-equipment-table tr,#equipment-table tr,#limitedUse-equipment-table tr"))
})

$(_ => {
    new DataTable($("#focus-table"))
    new DataTable($("#magical-equipment-table"))
    new DataTable($("#equipment-table"))
    new DataTable($("#limitedUse-equipment-table"))
    new DataTable($("#tomte-mixture-table"))
    new RuneTable($("#rune-table"))
    new WordTable($("#word-table"))
})
