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

    localized_hp = {
        3: {"head": 3, "trunk": 3, "arm": 3, "leg": 3},
        4: {"head": 3, "trunk": 4, "arm": 3, "leg": 3},
        5: {"head": 3, "trunk": 5, "arm": 3, "leg": 4},
        6: {"head": 4, "trunk": 6, "arm": 3, "leg": 4},
        7: {"head": 4, "trunk": 6, "arm": 4, "leg": 4},
        8: {"head": 4, "trunk": 7, "arm": 4, "leg": 5},
        9: {"head": 5, "trunk": 8, "arm": 4, "leg": 5},
        10: {"head": 5, "trunk": 9, "arm": 5, "leg": 5},
        11: {"head": 5, "trunk": 10, "arm": 5, "leg": 6},
        12: {"head": 6, "trunk": 10, "arm": 5, "leg": 6},
        13: {"head": 6, "trunk": 11, "arm": 6, "leg": 6},
        14: {"head": 6, "trunk": 12, "arm": 6, "leg": 7},
        15: {"head": 7, "trunk": 13, "arm": 6, "leg": 7},
        16: {"head": 7, "trunk": 14, "arm": 7, "leg": 7},
        17: {"head": 7, "trunk": 15, "arm": 7, "leg": 8},
        18: {"head": 8, "trunk": 16, "arm": 7, "leg": 8},
        19: {"head": 8, "trunk": 17, "arm": 8, "leg": 8},
        20: {"head": 8, "trunk": 18, "arm": 8, "leg": 9},
        21: {"head": 8, "trunk": 19, "arm": 8, "leg": 9},
        22: {"head": 8, "trunk": 20, "arm": 9, "leg": 9},
        23: {"head": 8, "trunk": 21, "arm": 9, "leg": 10},
        24: {"head": 8, "trunk": 22, "arm": 9, "leg": 10},
        25: {"head": 8, "trunk": 23, "arm": 10, "leg": 10},
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

    set_hp(unlocalized_hp, localization = true) {
        set_slider_max(this.get("hp"), unlocalized_hp, true)
        if (!(unlocalized_hp in this.localized_hp) && localization) {
            alert("Pas de conversion automatique entre '" + unlocalized_hp + "' PV non-localisés en PV localisés")
            return
        }
        if (!localization)
            return
        const conversion = this.localized_hp[unlocalized_hp]
        set_slider_max(this.get("hp-head"), conversion["head"], true)
        set_slider_max(this.get("hp-trunk"), conversion["trunk"], true)
        set_slider_max(this.get("hp-right-arm"), conversion["arm"], true)
        set_slider_max(this.get("hp-left-arm"), conversion["arm"], true)
        set_slider_max(this.get("hp-right-wing"), conversion["arm"], true)
        set_slider_max(this.get("hp-left-wing"), conversion["arm"], true)
        set_slider_max(this.get("hp-right-leg"), conversion["leg"], true)
        set_slider_max(this.get("hp-left-leg"), conversion["leg"], true)
        set_slider_max(this.get("unease"), conversion["trunk"] + 1)
        this.get("unease").slider("setValue", 0).slider("refresh", {useCurrentValue: true}).trigger("change")
    }

    is_localized() {
        return !this.get("localized-status").hasClass("d-none")
    }

    toggle_localization() {
        if (this.is_localized()) {
            this.get("non-localized-status").removeClass("d-none")
            this.get("localized-status").addClass("d-none")
            this.get("add-localization").removeAttr("hidden").tooltip()
            this.get("remove-localization").tooltip("dispose").attr("hidden", "hidden")
        } else {
            this.get("non-localized-status").addClass("d-none")
            this.get("localized-status").removeClass("d-none")
            this.get("add-localization").tooltip("dispose").attr("hidden", "hidden")
            this.get("remove-localization").removeAttr("hidden").tooltip()
        }
    }
}

class NPCGrid extends DataTable {
    static row_class = NPC

    bestiary = []
    priority_keys = ["combat", "hp", "unease", "full-armor"]
    input_less_keys = ["localization", "wings"]

    constructor(table) {
        super(table)
        const bestiary = $("#bestiary").on("change", e => {
            this.load_bestiary($(e.target).val())
        })
        this.load_bestiary(bestiary.val())
        this.add_button.off("click").on("click", (event, idx = null) => { // Add parameter for forced index
            const row = this.add_row(idx)
            changed_page = true
            if (idx == null) {
                // We are not importing new data and want to take the selection of the base NPC into account
                const creature_name = $("#npc-table-add-select").val()
                if (creature_name) {
                    const creature = $(this.bestiary).filter((_, c) => c.name === creature_name)
                    if (creature.length > 0) {
                        this.load_creature(row, creature.get(0))
                    }
                }
            }
        })
    }

    load_bestiary(new_bestiary) {
        new_bestiary = JSON5.parse(new_bestiary)

        // Overwrite entries with the same name
        $(this.bestiary).map((idx, current_elem) => {
            const updated_elem = $(new_bestiary).filter((_, new_elem) => new_elem.name === current_elem.name)
            if (updated_elem.length > 0) // Overwrite elements with the same name
                this.bestiary[idx] = updated_elem.get(0)
        })

        // Add new entries
        $(new_bestiary).map((_, new_elem) => {
            const same_elem = $(this.bestiary).filter((_, current_elem) => new_elem.name === current_elem.name)
            if (same_elem.length === 0) // Overwrite elements with the same name
                this.bestiary.push(new_elem)
        })

        // Update the field, so that it stays upon saving
        $("#bestiary").text(JSON5.stringify(this.bestiary))

        // Add names to the select
        const creature_list = this.bestiary.map(elem => {
            return {name: elem.name, content: null}
        })
        creature_list.push({name: "", content: null})
        update_select($("#npc-table-add-select"), $(creature_list))
    }

    load_creature(row, creature) {
        for (const [key, value] of Object.entries(creature).sort((a, b) => {
            if (this.priority_keys.includes(a[0]) && !this.priority_keys.includes(b[0]))
                return -1 // Favor priority key a
            else if (!this.priority_keys.includes(a[0]) && this.priority_keys.includes(b[0]))
                return 1 // Favor priority key b
            else if (this.priority_keys.includes(a[0]) && this.priority_keys.includes(b[0]))
                // Favor the index in the priority list
                return this.priority_keys.indexOf(a[0]) < this.priority_keys.indexOf(b[0]) ? -1 : (a[0] === b[0]) ? 0 : 1
            else
                return a[0].localeCompare(b[0])
        })) {
            const input = row.get(key)
            if (input.length === 0 && !this.input_less_keys.includes(key)) {
                alert("Le champ avec l'id '" + key + "' du '" + value.name + "' est introuvable")
                continue
            }
            if (key === "hp") {
                row.set_hp(value,  !("localization" in creature) || creature["localization"])
            } else if (key === "localization") {
                if (!value)
                    row.toggle_localization()
            } else if (key === "wings") {
                if (value)
                    row.find(".wing-div").removeClass("invisible")
            } else if (input.hasClass("input-slider")) {
                // Update the maximum of a slider
                set_slider_max(input, value, true)
                if (key === "unease") { // Unease need to be set to 0
                    input.slider("setValue", 0).slider("refresh", {useCurrentValue: true}).trigger("change")
                }
            } else {
                input.val(value).trigger("change")
                if (key === "combat") {
                    // Set the default value for basic abilities to the same value as combat
                    row.get("combat-2").val(value).trigger("change")
                    row.get("cavalry").val(value).trigger("change")
                    row.get("run").val(value).trigger("change")
                } else if (key === "full-armor") {
                    row.armor_overwrite()
                }
            }
        }
    }

    toggle_localization(event) {
        let button = $(event.target)
        if (!button.hasClass("npc-localization")) {
            button = button.parents(".npc-localization")
        }
        row_of(button).toggle_localization()
    }

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

        /* Localization switch */
        row.get("add-localization").uon("click", this.toggle_localization)
        row.get("remove-localization").uon("click", this.toggle_localization)

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

let npc_grid = null

$("#import-bestiary").on("change", event => {
    if (event.target.files.length === 0)
        return

    const reader = new FileReader()
    reader.onload = e => {
        // Executed at the completion of the read
        try {
            JSON5.parse(e.target.result)
            npc_grid.load_bestiary(e.target.result)
        } catch (e) {
            alert("Le document n'est pas un bestiaire. Si vous essayez d'importer une fiche ou un plugin,"
                + " utilisez un des autres boutons.")
            return
        }
        event.target.setAttribute("value", "")
        $(event.target).next().text("Importer un bestiaire")
    }

    // Asynchronous read
    reader.readAsText(event.target.files[0])
})

$(_ => {
    npc_grid = new NPCGrid($("#npc-table"))
})
