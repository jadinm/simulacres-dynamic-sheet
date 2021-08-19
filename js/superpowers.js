class SuperpowerRow extends RollRow {
    realm(realm_based_div) {
        return "" // No realm for superpowers
    }

    component_value() {
        return this.formula_elem("component")[0]
    }

    means_value() {
        return this.formula_elem("means")[0]
    }

    update_roll_value() {
        // Recover component, means
        let nbr_dices = this.component_value()
        let under_value = this.means_value()

        // Retrieve dice and value modifier
        const component_modifier = parseInt(this.get("component-modifier").val())
        if (!isNaN(component_modifier))
            nbr_dices += component_modifier
        const means_modifier = parseInt(this.get("means-modifier").val())
        if (!isNaN(means_modifier))
            under_value += means_modifier

        // Update
        this.get("nbr-dices").text(Math.max(0, nbr_dices))
        this.get("under-value").text(Math.max(0, under_value))
    }

    roll_reason() {
        return this.get("name").val()
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        const formula_elements = this.compute_formula()[1]
        let nbr_dices = parseInt(this.get("nbr-dices").text())
        if (isNaN(nbr_dices)) {
            nbr_dices = 0
        }
        let under_value = parseInt(this.get("under-value").text())
        if (isNaN(under_value)) {
            under_value = 0
        }
        let power_distance = this.get("distance").val()
        let power_focus = this.get("time").val()
        let power_duration = this.get("duration").val()

        // Equipment linked to the roll
        const equipment_id = this.get("equipment").val()
        const equipment = (equipment_id && equipment_id.length > 0) ? row_of($("#" + this.get("equipment").val())).get("name").val() : ""

        const exploding_effect = this.get("details-exploding-effect").prop("checked")

        // Do the actual roll
        new SuperpowerRoll(this.roll_reason(), nbr_dices, under_value, formula_elements, power_distance, power_focus,
            power_duration, this.get("effect").val(), equipment, equipment_id, exploding_effect).trigger_roll()
    }
}

class SuperpowerRollTable extends TalentRollTable {
    static row_class = SuperpowerRow

    static components() {
        // Get all of the superpower components
        return $(".superpower").map((i, elem) => {
            const component = row_of(elem).formula_elem("component")[1].filter((i, elem) => {
                return $(elem).attr("name").includes("component")
            }).map((i, elem) => {
                const base_array = elem.id.split("-")
                return base_array[base_array.length - 1]
            })
            return component ? component[0] : []
        }).toArray().flat()
    }

    formula_changed(e) {
        super.formula_changed(e)

        // Update all of the roll and spell values
        $(".row-roll-trigger").each((i, elem) => {
            row_of(elem).update_roll_value(elem)
        })
    }

    update_value(e) {
        row_of(e.target).update_roll_value()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.get("component-modifier").uon("change", this.update_value)
        row.get("means-modifier").uon("change", this.update_value)
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }
}

/* Triggers */

$("#superpower-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#superpower-table tr"))
})
