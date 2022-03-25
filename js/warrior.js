class WarriorRow extends PsiRow {
    static selects_no_sanitize = ["energy"]
    static selects = [...super.selects, ...this.selects_no_sanitize]
    static basic_inputs = [...this.numeric_inputs, ...["name", "duration", "effect", "details-max", "details-min"]]
    static duplicated_inputs = {
        "time": ["1", "2", "3"],
        "duration": ["1", "2", "3"],
        "effect": ["1", "2", "3"],
    }

    // Listener for the selection of the energy
    select_changed(e) {
        this.update_level()
    }

    energy_name() {
        return this["energy"]
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template())
            sheet["characteristics"].update_energy_select()
    }
}

class WarriorRollTable extends PsiRollTable {
    static row_class = WarriorRow
}

$("#warrior-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#warrior-table tr"))
})
