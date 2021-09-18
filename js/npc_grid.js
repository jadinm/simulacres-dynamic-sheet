class NPC extends DataRow {

    talent_level_select = {
        "cavalry": "cavalry-level",
        "combat": "combat-level",
        "combat-2": "combat-level"
    }

    effect_input = {
        "combat": "combat-effect",
        "combat-2": "combat-2-effect",
        "run": "movement"
    }

    reasons = {
        "cavalry": "Conduite/Équitation",
        "combat": "Combat (arme principale)",
        "combat-2": "Combat (arme secondaire)",
        "magic": "Résistance magique",
        "perception": "Perception",
        "run": "Course"
    }

    armor_overwrite() {
        if (this.get("armor-overwrite")[0].checked) {
            this.find("input.armor").val(this.get("full-armor").val()).trigger("change")
        }
    }

    update_armor_penalty() {
        // Sum all the armor
        const armors = $.map(this.find(".armor"), element => (parseInt(element.value) || 0))
        let armor_sum = 0
        for (let i = 0; i < armors.length; i++) {
            armor_sum += armors[i]
        }

        // Adapt unease with armor penalty
        const penalty = armor_penalty(armor_sum)
        const penalty_number = isNaN(penalty) ? -3 : penalty

        const unease = this.get("unease")
        unease.slider("setValue", parseInt(unease.slider("getAttribute", "min")) - penalty_number)
        unease.slider("refresh", {useCurrentValue: true})
    }

    save_hidden_fields() {
        this.get("defense").val($("#roll-dialog-defense").val()).trigger("change")
        this.get("attack").val($("#roll-dialog-attack").val()).trigger("change")
        this.get("total-attack").val($("#roll-dialog-total-attack").val()).trigger("change")
    }

    push_hidden_fields() {
        $("#roll-dialog-defense").val(this.get("defense").val()).trigger("change")
        $("#roll-dialog-attack").val(this.get("attack").val()).trigger("change")
        $("#roll-dialog-total-attack").val(this.get("total-attack").val()).trigger("change")
    }

    roll(button) {
        // Save old answers to compute
        if (current_roll && current_roll instanceof TalentRoll && current_roll.energy_base_id.length > 1) {
            row_of($("#" + current_roll.energy_base_id.substring(0, current_roll.energy_base_id.length - 1))).save_hidden_fields()
        }

        const value_input = button.parent().prev().find("input")
        const value_suffix = value_input[0].id.split(this.row_index + "-")[1]

        // Find the talent level from the type of NPC as show in select inputs
        const talent_level = value_suffix in this.talent_level_select ? parseInt(this.get(this.talent_level_select[value_suffix]).val()) : 0

        // Find the effect input if any
        const effect = value_suffix in this.effect_input ? this.get(this.effect_input[value_suffix]).val() : ""

        // The title of the roll
        const reason = value_suffix in this.reasons ? this.reasons[value_suffix] + " (" + this.get("name").val() + ")" : ""

        // Get the value and apply unease
        const value = (parseInt(value_input.val()) || 0) + get_unease(this.row_index + "-")

        // Push hidden fields
        this.push_hidden_fields()

        new TalentRoll(reason, value, talent_level, effect,
            0, [], NaN, false, false,
            "", "", "", 0, "", "",
            "", "", false, "",
            this.row_index + "-").trigger_roll()
    }
}

class NPCGrid extends DataTable {
    static row_class = NPC

    armor_overwrite(event) {
        row_of(event.target).armor_overwrite()
    }

    update_armor_penalty(event) {
        row_of(event.target).update_armor_penalty()
    }

    trigger_roll(event) {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass("row-roll-trigger"))
            button = $(event.target).parents(".row-roll-trigger")
        row_of(button).roll(button)
    }

    copy_row(event) {
        let button = $(event.target)
        if (!button.hasClass("npc-copy")) {
            button = button.parents(".npc-copy")
        }
        table_of(button).add_row(null, row_of(button))
        changed_page = true
    }

    add_row(fixed_idx = null, from_row = null) {
        const row = super.add_row(fixed_idx)
        row.get("name").val("NPC " + row.row_number).trigger("change")

        // Copy data from one NPC to the other
        if (from_row) {
            import_data(from_row.data, row.data, false, true)
        }
        return row
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)

        /* Status part */
        init_status(row.row_index + "-")
        row.find("[data-toggle=\"tooltip\"]").tooltip()
        row.get("increment-unease").uon("click", increment_unease)
        row.get("decrement-unease").uon("click", decrement_unease)
        row.get("increment-breath").uon("click", increment_breath)
        row.get("decrement-breath").uon("click", decrement_breath)
        row.get("increment-psychic").uon("click", increment_psychic)
        row.get("decrement-psychic").uon("click", decrement_psychic)
        row.find("[id*=increment-hp]").uon("click", increment_hp)
        row.find("[id*=decrement-hp]").uon("click", decrement_hp)
        row.find("[id*=details-hp]").uon("change", details_hp)
        row.find(".armor").uon("change", this.update_armor_penalty)

        /* Armor lock */
        row.get("armor-overwrite").uon("change", this.armor_overwrite)
        row.get("full-armor").uon("change", this.armor_overwrite)

        /* Copy NPC */
        row.get("copy").uon("click", this.copy_row)

        /* Roll triggers */
        row.find(".row-roll-trigger").uon("click", this.trigger_roll)

        /* Selects */
        row.get("combat-level").selectpicker()
        row.get("cavalry-level").selectpicker()
    }
}

$(_ => {
    new NPCGrid($("#npc-table"))
})
