const light_bonus_class = "light-bonus-applied"
const heavy_bonus_class = "heavy-bonus-applied"
const bonus_applied = "bonus-applied"

class Characteristics extends Model {
    static components = to_id_array($(".component"))
    static means = to_id_array($(".means"))
    static realms = to_id_array($(".realm"))
    static base_energies = to_id_array($(".energy"))
    static special_energies = to_id_array($(".special-energy"))
    static energy_names = to_id_array($(".energy-name"))
    static realms_and_energies = [...this.realms, ...this.base_energies]
    static formula_parts = [...this.components, ...this.means, ...this.realms]
    static magic_based_inputs = universe === med_fantasy ? ["black-magic", "malemagite"] : []
    static numeric_inputs = [...this.formula_parts, ...this.base_energies, ...this.special_energies, ...this.magic_based_inputs]
    static basic_inputs = [...this.numeric_inputs, ...this.energy_names]
    static save_input_classes = matrix_4x4 ? {
        "resistance": [light_bonus_class, heavy_bonus_class],
        "instincts": [bonus_applied],
        "heart": [bonus_applied],
        "mind": [bonus_applied],
    } : {
        "resistance": [light_bonus_class, heavy_bonus_class],
        "heart": [bonus_applied],
        "mind": [bonus_applied],
    }

    static formula_images = {}

    static reload_energies() {
        this.base_energies = to_id_array($(".energy"))
        this.special_energies = to_id_array($(".special-energy"))
        this.energy_names = to_id_array($(".energy-name"))
        this.realms_and_energies = [...this.realms, ...this.base_energies]
        this.numeric_inputs = [...this.formula_parts, ...this.base_energies, ...this.special_energies, ...this.magic_based_inputs]
        this.basic_inputs = [...this.numeric_inputs, ...this.energy_names]
    }

    static build_svg_image(element_id) {
        if (element_id in this.formula_images)
            return this.formula_images[element_id]
        let symbol = $("#" + element_id).parent().find("svg use")
        if (symbol.length === 0)
            return null
        this.formula_images[element_id] = "<svg width=\"1em\" height=\"1em\">" + symbol[0].outerHTML + "</svg>"
        return this.formula_images[element_id]
    }

    update_realm_energy_select() {
        update_numeric_input_select(this.find("select.realm-energy-select"), this.find(".energy,.realm"))
    }

    update_energy_select() {
        update_numeric_input_select(this.find("select.energy-select"), this.find(".energy"))
    }

    update_special_energy_select() {
        update_numeric_input_select(this.find("select.special-energy-select"), this.find(".special-energy"))
    }

    update_component_select() {
        update_numeric_input_select(this.find("select.component-select"), this.find(".component"))
    }

    add_listeners() {
        super.add_listeners()
        const characteristics = this.constructor.basic_inputs
        for (let i = 0; i < characteristics.length; i++) {
            const variable = characteristics[i]
            this.get(variable).on("change", event => {
                if (this.constructor.components.includes(variable) || this.constructor.means.includes(variable)) {
                    // Update matrix sums
                    this.update_sum(event.target.id)
                    if (!discovery) { // Update HP/breath/psychic based on stats
                        if (variable === "resistance") {
                            sheet.status.update_resistance($(event.target), this[variable])
                        } else if (variable === "instincts" || variable === "heart") {
                            sheet.status.update_body_energy($(event.target), this[variable], "breath")
                        } else if (variable === "mind") {
                            sheet.status.update_body_energy($(event.target), this[variable], "psychic")
                        }
                    }
                }
                // Update rolls
                if (this.constructor.formula_parts.includes(variable)) {
                    sheet.get_all_rolls_with_formula_part(variable).forEach((row) => {
                        row.update_roll_value()
                    })
                }
                if (this.constructor.realms_and_energies.includes(variable)) {
                    this.update_realm_energy_select()
                    if (this.constructor.base_energies.includes(variable)) {
                        update_energy_investment_list(event.target)

                        $("select.energy-select").each((i, elem) => {
                            this.update_energy_select(elem)
                        })

                        sheet["warrior_way"].rows.forEach((row) => {
                            if (row.energy_name() === variable)
                                row.update_level()
                        })
                    }
                } else if (this.constructor.special_energies.includes(variable)) {
                    this.update_special_energy_select()
                    if (variable === "psi") {
                        sheet["psi_powers"].rows.forEach((row) => {
                            row.update_level()
                        })
                    } else if (variable === "ki") {
                        sheet["ki_powers"].rows.forEach((row) => {
                            row.update_level()
                        })
                    }
                } else if (this.constructor.components.includes(variable)) {
                    this.update_component_select()
                }
                // Update AP consumption
                compute_remaining_ap()
            })
        }

        if (Object.keys(sheet.opts).length === 0) {
            $("select.energy-select").each((i, elem) => {
                this.update_energy_select(elem)
            })
        }
    }

    /**
     * Update the sums that depend on the component's or the means' id
     * @param id
     */
    update_sum(id) {
        const others = this.constructor.components.includes(id) ? this.constructor.means : this.constructor.components

        for (let i = 0; i < others.length; i++) {
            if (this[id] >= 0 && this[others[i]] >= 0) {
                const sum_elem = this.get(this.constructor.components.includes(id) ? id + "-" + others[i] : others[i] + "-" + id)
                sum_elem.text((parseInt(this[id]) || 0) + (parseInt(this[others[i]]) || 0))
            }
        }
    }

    /**
     * Update inputs and the sum of components and realms
     */
    write() {
        super.write()

        // Update the sum of each element
        for (let i = 0; i < this.constructor.means.length; i++) {
            const mean = this.get(this.constructor.means[i])
            if (mean.length > 0)
                this.update_sum(this.constructor.means[i])
        }
    }
}
