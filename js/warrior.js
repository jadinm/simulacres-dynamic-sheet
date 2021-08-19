class WarriorRow extends PsiRow {

    energy() {
        return this.get("energy").val()
    }

    energy_level() {
        const energy_id = this.energy()
        return energy_id === "" ? NaN : parseInt($("#" + energy_id).val())
    }
}

class WarriorRollTable extends PsiRollTable {
    static row_class = WarriorRow

    // Listener for the selection of the energy
    select_changed(e) {
        row_of(e.target).update_level()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        const select = row.get("energy")
        select.selectpicker({sanitize: false})
        update_energy_select(select[0])
    }
}

function update_energy_select(select) {
    update_numeric_input_select(select, $(".energy"))
}

$(".energy").on("change", _ => {
    $("select.energy-select").each((i, elem) => {
        update_energy_select(elem)
    })
    $("#warrior-table .row-roll-trigger").each((i, elem) => {
        row_of(elem).update_level()
    })
})

$("#warrior-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#warrior-table tr"))
})

$(_ => {
    new WarriorRollTable($("#warrior-table"))
})
