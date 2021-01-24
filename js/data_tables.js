const row_id_regex = /(\w+-(x|\d+))-?(.*)/

class DataRow {

    constructor(data) {
        this.data = $(data)
        this.id = this.data[0].id
        this.row_index = this.data[0].id.match(row_id_regex)[1]
    }

    get(element_id_suffix) {
        return $("#" + this.row_index + "-" + element_id_suffix)
    }

    static of(base_elem) {
        const base_id = $(base_elem)[0].id.match(row_id_regex)[1]
        return new this.prototype.constructor($("#" + base_id))
    }
}

class DataTable {
    row_class = DataRow

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
    }

    is_template_row(row) {
        return $(row)[0].id === this.template_row[0].id
    }

    add_custom_listener_to_row(row) {
    }

    add_custom_listeners() {
        this.table.children().each((i, elem) => {
            if (!this.is_template_row(elem)) {
                this.add_custom_listener_to_row(new this.row_class(elem))
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
        const row = new this.row_class(new_elem)
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

class KiTable extends DataTable {

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        const select = row.get("name")
        select.selectpicker()
        add_save_to_dom_listeners(row.data)
        row.get("level").uon("change", compute_remaining_ap)
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }

    remove_row(event) {
        super.remove_row(event)
        compute_remaining_ap()
    }
}

$(_ => {
    new DataTable($("#focus-table"))
    new DataTable($("#magical-equipment-table"))
    new DataTable($("#equipment-table"))
    new DataTable($("#limitedUse-equipment-table"))
    new KiTable($("#ki-table"))
})
