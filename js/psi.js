class PsiRow extends SpellRow {
    level(leveled_div) {
        const level_split = $(leveled_div)[0].id.split("-")
        const level = parseInt(level_split[level_split.length - 1])
        return isNaN(level) ? "" : String(level)
    }

    energy() {
        return "psi"
    }

    energy_level() {
        return parseInt($("#psi").val())
    }

    get(element_id_suffix, leveled_div = null) {
        let elem = super.get(element_id_suffix)
        if (elem.length === 0 && leveled_div) {
            elem = super.get(element_id_suffix + "-" + this.level(leveled_div))
        }
        return elem
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

    update_roll_value() {
        super.update_roll_value()

        // Don't activate powers if the talent level is at X
        let level = parseInt(talent_level(talent_from_name(this.get("talent").val())))

        if (isNaN(level)) {
            this.data.find(".row-roll-trigger").filter(this.filter_invisible_dices).each((i, dice_div) => {
                dice_div.setAttribute("hidden", "hidden")
            })
        }
    }
}

class PsiRollTable extends SpellRollTable {
    static row_class = PsiRow

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

$("#psi").on("change", event => {
    $("#psi-table .row-roll-trigger").each((i, elem) => {
        row_of(elem).update_level()
    })
})

$(_ => {
    new PsiRollTable($("#psi-table"))
})
