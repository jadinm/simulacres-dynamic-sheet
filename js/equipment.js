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
        if (!this.is_template())
            this.get("name").uon("change", update_equipment_selects)
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
    static basic_inputs = [...this.numeric_inputs, ...["name", "details"]]
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
