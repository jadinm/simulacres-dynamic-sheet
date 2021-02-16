class PsiRollTable extends SpellRollTable {

    show_difficulty_builder(input) {
        const spell = row_of(input)
        return value => {
            spell.get("difficulty", input).text(value)
            return "0"
        }
    }
}

$("#psi-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#psi-table tr"))
})

$(_ => {
    new PsiRollTable($("#psi-table"))
})
