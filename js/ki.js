class KiRow extends SpellRow {
    update_realm(realm_div) {
    }

    roll_reason() {
        const talent = this.get("talent").find("option:selected").val()
        const name = this.get("name").text()
        let title = talent
        if (name.length > 0) {
            title = name + ((title.length > 0) ? " (" + title + ")" : "")
        }
        return title
    }
}

class KiTable extends PsiRollTable {
    static row_class = KiRow

    update_level(e) {
        row_of(e.target).update_level()
        super.update_level(e)
    }
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

$(_ => {
    // Initialize tables
    new KiTable($("#ki-table"))
})
