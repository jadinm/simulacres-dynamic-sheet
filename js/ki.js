class KiRow extends PsiRow {
    static requirements = RollRow.requirements

    static selects_no_sanitize = RollRow.selects_no_sanitize
    static selects = RollRow.selects
    static numeric_inputs = [...RollRow.numeric_inputs, ...["level"]]
    static basic_inputs = [...this.numeric_inputs,
        ...["talent", "time", "duration", "effect", "details-name", "details-max", "details-min"]]
    static sliders = []

    update_realm(realm_div) {
    }

    energy_name() {
        return "ki"
    }

    is_talent_based_spell() {
        return true
    }

    get_difficulty(realm) {
        return 0 // The difficulty depends on the talent level, not a difficulty slider
    }

    roll_reason() {
        const talent = this["talent"]
        const name = this["details-name"]
        let title = talent
        if (name.length > 0) {
            title = name + (title ? " (" + title + ")" : "")
        }
        return title ? title : ""
    }
}

class KiTable extends PsiRollTable {
    static row_class = KiRow
}

$("#ki").on("change", event => {
    let max_value = $(event.target).val()
    if (max_value <= 0)
        max_value = 1
    else if (max_value > 3)
        max_value = 3

    $("#ki-table [id*=-level]").each((i, elem) => {
        elem.setAttribute("max", max_value)
        const current_value = $(elem).val()
        if (current_value > max_value) {
            $(elem).val(max_value).trigger("change")
        }
    })
})

$("#ki-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#ki-table tr"))
})
