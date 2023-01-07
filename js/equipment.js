let last_equipment_share = null
const equipment_import_error_div = $("#import-equipment-error")
const equipment_import_success_div = $("#import-equipment-success")
const equipment_merchant_error_div = $("#buy-equipment-error")
const equipment_merchant_success_div = $("#buy-equipment-success")

const search_input = $("#buy-equipment-search")

class Money extends Model {
    static numeric_inputs = universe === med_fantasy ? ["copper-coins", "silver-coins", "gold-coins"]
        : (universe === captain_voodoo ? ["peso-de-ocho"] : [])
    static text_inputs = universe === med_fantasy ? ["copper-currency", "silver-currency", "gold-currency"]
        : (universe === captain_voodoo ? ["copper-currency"] : ["money"])
    static basic_inputs = [...this.numeric_inputs, ...this.text_inputs]

    can_pay(coppers) {
        if (universe === med_fantasy) {
            return this["gold-coins"] * 100 + this["silver-coins"] * 10 + this["copper-coins"] >= coppers
        } else if (universe === captain_voodoo) {
            return this["peso-de-ocho"] >= coppers
        }
        // We do not automatically handle generic money field
        return true
    }

    set_new_amount(amount) {
        amount = Math.max(amount, 0)
        if (universe === med_fantasy) {
            const gold_coins = Math.floor(amount / 100)
            const silver_coins = Math.floor((amount - 100 * gold_coins) / 10)
            const copper_coins = (amount - 100 * gold_coins - 10 * silver_coins)
            this.get("gold-coins").val(gold_coins).trigger("change")
            this.get("silver-coins").val(silver_coins).trigger("change")
            this.get("copper-coins").val(copper_coins).trigger("change")
        } else if (universe === captain_voodoo) {
            this.get("peso-de-ocho").val(amount).trigger("change")
        }
        // We do not automatically update generic money field
    }

    pay(coppers) {
        let bank = 0
        if (universe === med_fantasy) {
            bank = this["gold-coins"] * 100 + this["silver-coins"] * 10 + this["copper-coins"]
        } else if (universe === captain_voodoo) {
            bank = this["peso-de-ocho"]
        } else {
            // We do not automatically update generic money field
            return
        }
        bank -= coppers
        this.set_new_amount(bank)
    }

    add_listeners() {
        super.add_listeners()
        this.get("copper-currency").on("change", _ => {
            if (this["copper-currency"])
                $(".price-currency").text("(" + this["copper-currency"] + ")")
            else
                $(".price-currency").text("")
        }).trigger("change")

        this.build_merchant_list()
    }

    build_merchant_list() {
        let goods_div = $("#buy-equipment-goods")

        // Clear old values
        goods_div.children().filter(":not(.d-none)").remove()
        search_input.val("")

        // Rebuild the list
        let idx = 0
        for (const equipment_complete_data of default_merchant) {
            // Find the equipment data
            let equipment_row_data = null
            let is_regular_equipment = false
            let equipment_table = null
            for (const table of EquipmentRow.equipment_tables) {
                if (!equipment_complete_data[table] || !equipment_complete_data[table].rows || equipment_complete_data[table].rows.length === 0)
                    continue
                equipment_row_data = equipment_complete_data[table].rows[0]
                is_regular_equipment = table === "equipment"
                equipment_table = table
                break
            }
            if (!equipment_row_data) {
                console.error("Cannot import a pre-encoded equipment because there is no equipment table data")
                continue
            }

            // Create a list item
            const equipment_div = goods_div.children().first().clone().removeClass("d-none").addClass("d-flex")

            const name_div = equipment_div.children().eq(1)
            name_div.text(equipment_row_data.name)

            const price = parseInt(equipment_row_data.price)
            const price_div = equipment_div.children().eq(2)
            const price_label = price_div.children().first()
            const price_input = price_div.children().eq(1)
            price_input.val(price)
            const new_input_id = price_input[0].id.replaceAll("-x", "-" + idx)
            price_input.attr("id", new_input_id)
            price_label.attr("for", new_input_id)

            let unit_input = null
            if (is_regular_equipment) {
                unit_input = equipment_div.children().first().removeClass("invisible").children().first()
            }

            // Import on click
            equipment_div.children().eq(3).on("click", _ => {
                equipment_merchant_error_div.text("")
                equipment_merchant_success_div.text("")
                let price = parseInt(price_input.val()) || 0
                if (unit_input) { // Update quantity
                    const new_quantity = parseInt(unit_input.val())
                    equipment_row_data.quantity = !isNaN(new_quantity) ? new_quantity : 1
                    price *= equipment_row_data.quantity
                }
                if (price > 0 && !this.can_pay(price)) {
                    equipment_merchant_error_div.text(equipment_row_data.name + " est trop cher")
                    return
                }
                import_equipment(JSON5.stringify(equipment_complete_data), true)
                if (price > 0) {
                    this.pay(price)
                }
                equipment_merchant_success_div.text(equipment_row_data.name + " a été acheté avec succès")
            })
            equipment_div.children().eq(4).on("click", _ => {
                equipment_merchant_error_div.text("")
                equipment_merchant_success_div.text("")
                if (unit_input) { // Update quantity
                    const new_quantity = parseInt(unit_input.val())
                    equipment_row_data.quantity = !isNaN(new_quantity) ? new_quantity : 1
                }
                import_equipment(JSON5.stringify(equipment_complete_data), true)
                equipment_merchant_success_div.text(equipment_row_data.name + " a été ajouté avec succès")
            })

            // Append to DOM
            goods_div.append(equipment_div)
            idx += 1
        }
    }
}

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

    equals(import_opts) {
        return false // We assume that there is no duplicate magical equipment
    }
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

    static ignored_equals_keys = [...super.ignored_equals_keys, ...[this.quantity]]

    merge(import_opts) {
        // Merging the same equipment == refilling
        this.get("quantity").val(this["quantity"] + import_opts.quantity).trigger("change")
    }
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

function import_equipment(json_str, merchant_based = false) {
    // Only show errors for user input
    const error_div = merchant_based ? $() : equipment_import_error_div
    const success_div = merchant_based ? $() : equipment_import_success_div

    // Reset errors
    error_div.text("")
    success_div.text("")

    let data
    try {
        data = JSON5.parse(json_str)
    } catch (error) {
        error_div.text("Le contenu du presse-papier est invalide.")
        console.error(error)
        return
    }

    let new_equipment_id = null
    for (const table of EquipmentRow.equipment_tables) {
        if (!data[table] || !data[table].rows || data[table].rows.length === 0)
            continue

        // Add the equipment
        sheet[table].import(data[table], data, true)
        let i = 0
        for (const equipment_row of sheet[table].rows) {
            if (equipment_row.equals(data[table].rows[0]))
                new_equipment_id = sheet[table].rows[i].id
            i++
        }
        delete data[table]  // This is already imported
        break
    }
    if (new_equipment_id == null) {
        error_div.text("Aucun équipement à importer.")
        console.error("Aucun équipement trouvé dans", json_str)
        return
    }

    // Import talent associated with the tests if not present
    if (data.required_talents) {
        TalentLists.add_missing_talents(data.required_talents)
        delete data.required_talents
    }

    // Replace the equipment id of the associated tests
    for (const [roll_table, table_data] of Object.entries(data)) {
        if (!Character.all_roll_tables.includes(roll_table)) {
            error_div.text("L'import des tests associés à l'équipement ont échoué.")
            console.error("La table", roll_table, "ne devrait pas se trouver dans les données à importer", json_str)
            return
        }
        if (!table_data.rows || table_data.rows.length === 0) {
            console.error("La table", roll_table, "ne devrait pas se trouver dans les données à importer si elle est vide", json_str)
            continue
        }
        for (const row of table_data.rows) {
            if (!row.equipment) {
                error_div.text("L'import des tests associés à l'équipement ont échoué.")
                console.error("Le test", JSON5.stringify(row), "n'a pas d'équipement associé")
                return
            }
            row.equipment = new_equipment_id
        }

        // Import associated roll (if they do not already exist)
        sheet[roll_table].import(table_data, data, true)
    }
    success_div.text("L'import de l'équipement a réussi.")
}

$("#equipment-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#focus-table tr,#magical-equipment-table tr,#equipment-table tr,#limitedUse-equipment-table tr"))
})

search_input.on("change", event => {
    let value = $(event.target).val().toLowerCase()
    $("#buy-equipment-goods li").slice(1).each((i, elem) => {
        const name = $(elem).children().eq(1).text().toLowerCase()
        if (value.length === 0 || name.includes(value)) {
            $(elem).removeClass("d-none").addClass("d-flex")
        } else {
            $(elem).addClass("d-none").removeClass("d-flex")
        }
    })
})

$("#export-equipment-share-again").on("click", _ => {
    if (last_equipment_share != null) {
        last_equipment_share.share_equipment(true)
    }
})

$("#import-equipment-start").on("click", _ => {
    import_equipment($("#import-equipment-value").val())
})
