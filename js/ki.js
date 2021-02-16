class KiRow extends SpellRow {

    level(leveled_div) {
        const level_split = $(leveled_div)[0].id.split("-")
        const level = parseInt(level_split[level_split.length - 1])
        return isNaN(level) ? "" : String(level)
    }

    get(element_id_suffix, leveled_div = null) {
        let elem = super.get(element_id_suffix)
        if (elem.length === 0 && leveled_div) {
            elem = super.get(element_id_suffix + "-" + this.level(leveled_div))
        }
        return elem
    }

    is_talent_based_spell() {
        return true
    }

    is_hermetic_spell() {
        return false
    }

    is_instinctive_magic() {
        return false
    }

    update_list() {
    }

    update_realm(realm_div) {
    }

    update_level() {
        let power_level = parseInt(this.get("level").val())
        if (isNaN(power_level))
            power_level = 1
        for (let i = 2; i <= power_level; i++) {
            const dice = this.get("dice-" + i)
            dice.parent().removeClass("d-none")
            this.get("duration", dice).removeClass("d-none")
            this.get("effect", dice).removeClass("d-none")
        }
        for (let i = power_level + 1; i <= 3; i++) {
            const dice = this.get("dice-" + i)
            dice.parent().addClass("d-none")
            this.get("duration", dice).addClass("d-none")
            this.get("effect", dice).addClass("d-none")
        }
        if (power_level > 1) {
            this.data.find(".ki-level-specific").removeClass("d-none")
        } else {
            this.data.find(".ki-level-specific").addClass("d-none")
        }

        // Update adventure points
        compute_remaining_ap()
    }
}

class KiTable extends SpellRollTable {
    static row_class = KiRow

    update_level(e) {
        row_of(e.target).update_level()
        super.update_level(e)
    }
}

$("#ki-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#ki-table tr"))
})

$(_ => {
    // Initialize tables
    new KiTable($("#ki-table"))
})
