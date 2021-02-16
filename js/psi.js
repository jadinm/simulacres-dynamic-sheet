class PsiRollTable extends SpellRollTable {

    show_difficulty_builder(input) {
        const spell = row_of(input)
        return value => {
            spell.get("difficulty", input).text(value)
            return "0"
        }
    }
}

$(_ => {
    new PsiRollTable($("#psi-table"))
})
