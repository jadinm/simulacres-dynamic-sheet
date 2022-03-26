class PsiRow extends SpellRow {
    static requirements = [
        "biography", // Some ethnics have formula bonuses
        "characteristics", // For the formula
        "status", // The unease is needed in the formula
        "superpowers", // Superpowers boost the final value of rolls with the same component
    ]

    static radio_groups = RollRow.radio_groups
    static independent_checkboxes = [...RollRow.v7_checkboxes, "details-equipment-always-expend"]
    static selects_no_sanitize = []
    static selects = ["equipment"]
    static numeric_inputs = RollRow.numeric_inputs
    static basic_inputs = [...this.numeric_inputs,
        ...["name", "time", "duration", "distance", "effect", "details-max", "details-min"]]
    static duplicated_inputs = {
        "duration": ["1", "2", "3"],
        "distance": ["1", "2", "3"],
        "effect": ["1", "2", "3"],
    }

    get_level(leveled_div) {
        const level_split = $(leveled_div)[0].id.split("-")
        const level = parseInt(level_split[level_split.length - 1])
        return isNaN(level) ? "" : String(level)
    }

    energy_name() {
        return "psi"
    }

    energy_level() {
        return sheet.characteristics[this.energy_name()]
    }

    get(element_id_suffix, leveled_div = null) {
        let elem = super.get(element_id_suffix)
        if (elem.length === 0 && leveled_div) {
            elem = super.get(element_id_suffix + "-" + this.get_level(leveled_div))
        }
        return elem
    }

    get_effect(leveled_div) {
        if (leveled_div === undefined) { // Output all the effects
            return this.constructor.duplicated_inputs.effect.map((elem) => {
                return "<br/>Niveau " + elem + ": " + this["effect-" + elem]
            }).join("")
        }
        return this["effect" + "-" + this.get_level(leveled_div)]
    }

    is_talent_based_spell() {
        return false
    }

    is_hermetic_spell() {
        return false
    }

    is_instinctive_magic() {
        return false
    }

    update_list() {
    }

    update_level() {
        let power_level = this.energy_level()
        if (isNaN(power_level) || power_level === 0)
            power_level = 1
        for (let i = 2; i <= power_level; i++) {
            const dice = this.get("dice-" + i)
            dice.parent().removeClass("invisible")
        }
        for (let i = power_level + 1; i <= 3; i++) {
            const dice = this.get("dice-" + i)
            dice.parent().addClass("invisible")
        }

        // Update value for visible elements
        this.update_roll_value()

        // Update adventure points
        compute_remaining_ap()
    }

    get_difficulty(realm) {
        return this["difficulty-input"]
    }

    update_roll_value() {
        super.update_roll_value()

        // Don't activate powers if the talent level is at X
        let level = this["talent"] ? parseInt(sheet.get_talent_from_name(this["talent"]).talent_level()) : 0

        if (isNaN(level)) {
            this.find(".row-roll-trigger").filter(this.filter_invisible_dices).each((i, dice_div) => {
                dice_div.setAttribute("hidden", "hidden")
            })
        }
    }

    show_difficulty_builder(input) {
        return value => {
            this.get("difficulty", input).text(value)
            return "0"
        }
    }
}

class PsiRollTable extends SpellRollTable {
    static row_class = PsiRow
}

$("#psi-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#psi-table tr"))
})

$("#psi").on("change", () => {
    $("#psi-table .row-roll-trigger").each((i, elem) => {
        row_of(elem).update_level()
    })
})
