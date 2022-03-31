class SuperpowerRow extends RollRow {
    static requirements = [
        "biography", // Some ethnics have formula bonuses
        "characteristics", // For the formula
        "status", // The unease is needed in the formula
    ]

    // No realm for superpowers
    static selects = []
    static radio_groups = {
        "component": Characteristics.components,
        "means": Characteristics.means,
    }
    static independent_checkboxes = []
    static numeric_inputs = ["component-modifier", "means-modifier"]
    static basic_inputs = [...this.numeric_inputs, ...["name", "time", "distance", "duration", "effect"]]

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
        const component_modifier = this["component-modifier"]
        if (!isNaN(component_modifier))
            nbr_dices += component_modifier
        const means_modifier = this["means-modifier"]
        if (!isNaN(means_modifier))
            under_value += means_modifier

        // Update
        this.get("nbr-dices").text(Math.max(0, nbr_dices))
        this.get("under-value").text(Math.max(0, under_value))
    }

    roll_reason() {
        return this["name"]
    }

    roll(button) {
        const formula_elements = this.compute_formula()[1]
        let nbr_dices = parseInt(this.get("nbr-dices").text())
        if (isNaN(nbr_dices)) {
            nbr_dices = 0
        }
        let under_value = parseInt(this.get("under-value").text())
        if (isNaN(under_value)) {
            under_value = 0
        }

        // Do the actual roll
        new SuperpowerRoll({
            reason: this.roll_reason(),
            nbr_dices,
            under_value,
            formula_elements,
            distance: this["distance"],
            time: this["time"],
            duration: this["duration"],
            effect: this.get("effect").val(),
        }).trigger_roll()
    }

    formula_changed(e) {
        super.formula_changed(e)

        // Update all of the roll and spell values
        sheet.get_all_rolls_with_formula_part(this.formula_elem("component")[1]).forEach((row) => {
            row.update_roll_value()
        })
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template()) {
            this.get("component-modifier").on("change", e => this.update_value(e))
            this.get("means-modifier").on("change", e => this.update_value(e))
        }
    }
}

class SuperpowerRollTable extends TalentRollTable {
    static row_class = SuperpowerRow

    static components() {
        // Get all of the superpower components
        const components = []
        sheet.superpowers.rows.forEach(row => {
            const component = row.component_value()
            if (component)
                components.push(components)
        })
        return components
    }
}

/* Triggers */

$("#superpower-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#superpower-table tr"))
})
