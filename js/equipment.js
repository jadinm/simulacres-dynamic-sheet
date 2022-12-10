let last_equipment_share = null
const equipment_import_error_div = $("#import-equipment-error")
const equipment_import_success_div = $("#import-equipment-success")

class EquipmentRow extends DataRow {
    static equipment_tables = [
        "focuses", "magical_equipment", "equipment", "limited_equipment"
    ]

    static quantity = null
    static unit = null

    unit() {
        return this.constructor.unit
    }

    add_listeners() {
        super.add_listeners()
        if (!this.is_template()) {
            this.get("name").uon("change", update_equipment_selects)
            this.get("share").on("click", () => this.share_equipment())
        }
    }

    current_charges() {
        return this[this.constructor.quantity]
    }

    expend_charges(expended_charges) {
        const input = this.get(this.constructor.quantity)
        this[this.constructor.quantity] = Math.max(0, this[this.constructor.quantity] - expended_charges)
        input.val(this[this.constructor.quantity])
        input.trigger("change")
    }

    share_equipment(copy_again = false) {
        // Export both the current data and the linked rolls
        const data = JSON5.stringify(sheet.export_equipment_data(this))
        // Copy to clipboard
        navigator.clipboard.writeText(data).then(
            () => {
                /* clipboard successfully set */
            },
            () => {
                /* clipboard write failed */
                console.error("Copy of equipment to clipboard failed")
            }
        )
        // Show explanation
        last_equipment_share = this
        if (!copy_again) {
            $("#export-equipment").modal()
        }
    }
}

class FocusRow extends EquipmentRow {
    static quantity = "charge"
    static unit = "charges"
    static numeric_inputs = ["charge", "max"]
    static basic_inputs = [...this.numeric_inputs, ...["name"]]
}

class FocusTable extends DataList {
    static row_class = FocusRow
}

class MagicalEquipmentRow extends FocusRow {
    static numeric_inputs = ["charge"]
    static basic_inputs = [...this.numeric_inputs, ...["name"]]
    static text_areas = ["details"]
}

class MagicalEquipmentTable extends DataList {
    static row_class = MagicalEquipmentRow
}

class RegularEquipmentRow extends EquipmentRow {
    static quantity = "quantity"
    static unit = "unités"
    static numeric_inputs = ["quantity"]
    static basic_inputs = [...this.numeric_inputs, ...["name", "price"]]
}

class RegularEquipmentTable extends DataList {
    static row_class = RegularEquipmentRow
}

class LimitedUseEquipmentRow extends MagicalEquipmentRow {
    static unit = "utilisations"
}

class LimitedUseEquipmentTable extends DataList {
    static row_class = LimitedUseEquipmentRow
}

function update_equipment_selects() {
    const equipment_list = sheet.equipments().filter((row) => {
        return row.name
    }).map((row) => {
        return {name: row.name, content: null, value: row.id}
    })

    $("select.equipment-select").each((i, elem) => {
        update_select($(elem), equipment_list)
    })
}

function import_equipment(json_str) {
    // Reset errors
    equipment_import_error_div.text("")
    equipment_import_success_div.text("")

    let data
    try {
        data = JSON5.parse(json_str)
    } catch (error) {
        equipment_import_error_div.text("Le contenu du presse-papier est invalide.")
        console.error(error)
        return
    }

    let new_equipment_id = null
    for (const table of EquipmentRow.equipment_tables) {
        if (!data[table] || !data[table].rows || data[table].rows.length === 0)
            continue

        const old_length = sheet[table].rows.length
        sheet[table].import(data[table], data, true)
        if (sheet[table].rows.length !== old_length + 1) {
            equipment_import_error_div.text("L'import de l'équipement a échoué.")
            console.error("L'import de", JSON5.stringify(data[table]), "a échoué dans la table", table)
            return
        }
        new_equipment_id = sheet[table].rows[sheet[table].rows.length - 1].id
        delete data[table]  // This is already imported
        break
    }
    if (new_equipment_id == null) {
            equipment_import_error_div.text("Aucun équipement à importer.")
            console.error("Aucun équipement trouvé dans", json_str)
            return
    }

    // Replace the equipment id of the associated tests
    for (const [roll_table, table_data] of Object.entries(data)) {
        if (!Character.all_roll_tables.includes(roll_table)) {
            equipment_import_error_div.text("L'import des tests associés à l'équipement ont échoué.")
            console.error("La table", roll_table, "ne devrait pas se trouver dans les données à importer", json_str)
            return
        }
        if (!table_data.rows || table_data.rows.length === 0) {
            console.error("La table", roll_table, "ne devrait pas se trouver dans les données à importer si elle est vide", json_str)
            continue
        }
        for (const row of table_data.rows) {
            if (!row.equipment) {
                equipment_import_error_div.text("L'import des tests associés à l'équipement ont échoué.")
                console.error("Le test", JSON5.stringify(row), "n'a pas d'équipement associé")
                return
            }
            row.equipment = new_equipment_id
        }
        // Import associated roll
        const old_length = sheet[roll_table].rows.length
        sheet[roll_table].import(table_data, data, true)
        if (sheet[roll_table].rows.length !== old_length + table_data.rows.length) {
            equipment_import_error_div.text("L'import de l'équipement a échoué.")
            console.error("L'import de", JSON5.stringify(table_data), "a échoué dans la table", roll_table)
            return
        }
    }
    equipment_import_success_div.text("L'import de l'équipement a réussi.")
}

$("#copper-currency").on("change", e => {
    const currency = $(e.target).val()
    if (currency)
        $(".price-currency").text("(" + currency + ")")
    else
        $(".price-currency").text("")
})

$(_ => {
    $("#copper-currency").trigger("change")
})

$("#equipment-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#focus-table tr,#magical-equipment-table tr,#equipment-table tr,#limitedUse-equipment-table tr"))
})

$("#export-equipment-share-again").on("click", _ => {
    if (last_equipment_share != null) {
        last_equipment_share.share_equipment(true)
    }
})

$("#import-equipment-start").on("click", _ => {
    import_equipment($("#import-equipment-value").val())
})
