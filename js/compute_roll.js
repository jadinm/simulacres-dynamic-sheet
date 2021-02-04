/* Rolls and spells */

realms = /mineral|vegetal|animal|natural|humanoid|mechanical|artificial|void|supernatural/

class RollRow extends DataRow {

    realm(realm_based_div) {
        const realm_split = $(realm_based_div)[0].id.split("-")
        const realm = realm_split[realm_split.length - 1]
        return realm.match(realms) ? realm : ""
    }

    formula_elem(element, fixed_realm = null) {
        const elem_name = this.id + "-" + element
        let checked_elem = $("input[name=" + elem_name + "]:checked")
        if (element === "realm" && fixed_realm != null)
            checked_elem = checked_elem.filter("[id*=\"-" + fixed_realm + "\"]")
        if (checked_elem.length === 0)
            return [0, $()]  // Allow partial formulas
        const base_array = checked_elem[0].id.split("-")
        const formula_base_name = base_array[base_array.length - 1]
        let bonus = 0
        if (formula_base_name === "resistance" && is_hobbit()) {
            bonus += 1 // Hobbits have an increased resistance
        }
        if (!(this instanceof SuperpowerRow)) {
            const components = SuperpowerRollTable.components()
            if (components.includes(formula_base_name))
                bonus += 4 // Super heroes have bonuses on all tests based on their component power
        }
        return [bonus + parseInt($("#" + formula_base_name).val()), checked_elem]
    }

    compute_formula(fixed_realm = null) {
        const elements = ["component", "means", "realm"]
        let sum = 0
        const checked_elements = []
        for (let i = 0; i < elements.length; i++) {
            const ret = this.formula_elem(elements[i], fixed_realm)
            sum += ret[0]
            if (ret[1].length > 0)
                checked_elements.push(ret[1])
        }
        return [sum, checked_elements]
    }

    update_roll_value() {
        let sum = 0

        // Recover component, means and realm
        const formula = this.compute_formula()[0]
        sum += formula

        // Add talent if any
        let talent = this.get("talent")
        if (talent.length === 0)
            return
        talent = talent.val()

        const talent_div = talent_from_name(talent)
        if (talent.length !== 0 && talent_div.length !== 0) {
            const level = talent_level(talent_div[0])
            if (level === "x")
                sum = "X"
            else
                sum += parseInt(level)
        }

        // Dual wielding: check tap talent level for penalty
        let tap_talent = this.get("tap-talent")
        tap_talent = tap_talent.val()
        if (tap_talent) {
            const tap_talent_div = talent_from_name(tap_talent)
            if (tap_talent_div.length === 0)
                sum = "X"
            else {
                const level = talent_level(tap_talent_div[0])
                if (level === "x")
                    sum = "X"
                else // Fixed penalty of using dual wielding
                    sum += Math.min(parseInt(level) - 2, 0)
            }
        }

        // Update
        this.get("value").text(sum)
        this.get("dice")[0].removeAttribute("hidden")
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let roll_reason
        let critical_increase = 0
        const formula_elements = this.compute_formula()[1]
        let margin_throttle = NaN
        const talent_select = this.get("talent")
        const talent = talent_select.find("option:selected").val()
        difficulty = parseInt(talent_level(talent_from_name(talent)))
        roll_reason = talent

        // Dual wielding
        const tap_talent_select = this.get("tap-talent")
        if (tap_talent_select.length > 0) {
            const tap_talent = tap_talent_select.find("option:selected").val()
            roll_reason = "Combat à deux armes: " + talent + " & " + tap_talent
            critical_increase += 1
        }
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Do the actual roll
        const value = parseInt(this.get("value").text())
        new TalentRoll(roll_reason, value, difficulty, this.get("effect").val(),
            critical_increase, formula_elements, margin_throttle, false, false,
            "", "").trigger_roll()
        $('#roll-dialog').modal()
    }
}

class SpellRow extends RollRow {

    get(element_id_suffix, realm_div = null) {
        let elem = super.get(element_id_suffix)
        if (elem.length === 0 && realm_div)
            elem = super.get(element_id_suffix + "-" + this.realm(realm_div))
        return elem
    }

    is_talent_based_spell() {
        return this.is_hermetic_spell()
    }

    is_hermetic_spell() {
        const value = this.get("list").val()
        return value && value.trim() === hermetic_energy
    }

    is_instinctive_magic() {
        const value = this.get("list").val()
        return value && value.trim() === instinctive_magic
    }

    update_roll_value() {
        this.data.find(".row-roll-trigger").each((i, dice_div) => {
            let sum = 0
            const realm = this.realm(dice_div)

            // Recover component, means and realm
            const formula = this.compute_formula(realm)[0]
            sum += formula

            // Recover difficulty
            const difficulty = this.get("difficulty", dice_div).text()
            if (difficulty)
                sum += parseInt(difficulty)

            if (this.is_talent_based_spell()) {
                // Recover hermetic difficulty
                const cast_diff = parseInt(this.get("hermetic-difficulty", dice_div).val())
                if (!isNaN(cast_diff)) {
                    sum += cast_diff
                }
                // Recover associated talent level
                const name = this.get("talent", dice_div).val()
                if (name && name.length !== 0) {
                    const talent = talent_from_name(name)
                    // This is complicated because hermetic spells can have a penalty when they are not learned correctly
                    // (MR < 0) and this penalty can be outside of the talent levels, like -6 or -3
                    // However, once the talent is raised for the first time, this odd penalty disappears
                    let level = parseInt(talent_level(talent[0]))
                    let origin_level = parseInt(talent_base_level(talent[0]))
                    let mr_learning = parseInt(this.get("hermetic-mr-learning", dice_div).val())

                    // For hermetic spells, a level "X" does not mean that they cannot cast the spell (though it will be difficult)
                    if (isNaN(level))
                        level = this.is_hermetic_spell() ? -5 : "X"
                    if (isNaN(origin_level))
                        origin_level = this.is_hermetic_spell() ? -5 : "X"
                    if (isNaN(mr_learning))
                        mr_learning = 0

                    if (level === origin_level && mr_learning < 0) {
                        // Did not pay the learning failure at least once
                        sum += mr_learning
                    } else if (!isNaN(level)) {
                        sum += level
                    }
                }
            }

            // Update
            this.get("value", dice_div).text(sum)
            dice_div.removeAttribute("hidden")
        })
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let roll_reason
        let critical_increase = 0
        const realm = this.realm(button)
        const spell_difficulty = this.get("difficulty", button)
        const formula_elements = this.compute_formula(realm)[1]
        let margin_throttle = NaN
        if (!this.is_talent_based_spell()) { // Spell
            difficulty = parseInt(spell_difficulty.text())
            roll_reason = this.get("name", button).val()
            margin_throttle = this.is_instinctive_magic(button[0]) ? 1 : NaN
        } else { // Talent
            const talent_select = this.get("talent", button)
            const talent = talent_select.find("option:selected").val()
            difficulty = parseInt(talent_level(talent_from_name(talent)))
            roll_reason = talent
        }
        let spell_distance = this.get("distance", button).val()
        let spell_focus = this.get("time", button).val()
        let spell_duration = this.get("duration", button).val()
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Do the actual roll
        const value = parseInt(this.get("value", button).text())
        new TalentRoll(roll_reason, value, difficulty, this.get("effect", button).val(),
            critical_increase, formula_elements, margin_throttle, this.data.hasClass("spell"),
            true, spell_distance, spell_focus, spell_duration).trigger_roll()
        $('#roll-dialog').modal()
    }

    update_realm(realm_div) {
        const spell_difficulty_inputs = this.get("difficulty-input", realm_div).parents(".spell-difficulty-row")
        const spell_value = this.get("value", realm_div).parents(".spell-value-row")
        const spell_difficulty = spell_difficulty_inputs.prev()
        const inline_realms = this.data.find("input[name*=-realm]:checked").length
        if (realm_div.prop("checked")) { // Show the checked realm-related variables
            spell_difficulty_inputs.removeClass("d-none")
            spell_difficulty.removeClass("d-none")
            spell_value.removeClass("d-none")
        } else {
            spell_difficulty_inputs.addClass("d-none")
            spell_difficulty.addClass("d-none")
            spell_value.addClass("d-none")
        }
        if (inline_realms > 1) {
            this.data.find(".spell-realm").removeClass("d-none")
        } else {
            this.data.find(".spell-realm").addClass("d-none")
        }

        // Update adventure points
        compute_remaining_ap()
    }

    update_list() {
        const list = this.get("list")
        const slider = this.data.find(".spell-difficulty-input")
        if (slider.length === 0 || slider[0].id.includes("-x-"))
            return
        const radio_buttons = this.data.find(".formula-elem")
        const difficulty = this.data.find(".spell-difficulty-value")
        const hermetic_difficulty = this.data.find(".hermetic-difficulty")
        const hermetic_mr_difficulty = this.data.find(".hermetic-mr-learning")
        const hermetic_talent = this.get("talent")
        const name = this.get("name")
        const handle = this.get("name-handle")
        const dice_3 = $("#spell-margin-good-nature-evil-1d3").parent()

        // Reset visibility of elements
        dice_3.addClass("d-none")
        dice_3.prev().addClass("d-none")
        radio_buttons.prop("disabled", false).removeAttr("disabled")
        radio_buttons.parent().children().removeClass("d-none")
        hermetic_difficulty.parent().addClass("d-none")
        hermetic_mr_difficulty.parent().addClass("d-none")
        hermetic_talent.parent().parent().addClass("d-none")
        name.removeClass("d-none")
        handle.removeClass("d-none")
        difficulty.parent().removeClass("d-none")

        if (list.val() && ([priest_energy, instinctive_magic].includes(list.val().trim()))) {
            // Fix the level to 0 if divine energy
            slider.each((i, elem) => {
                $(elem).val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
                $($(elem).slider("getElement")).parent().addClass("d-none")
            })
        } else if (list.val() && list.val().trim() === hermetic_energy) {
            // Show control specific to hermetic energy
            slider.each((i, elem) => {
                $(elem).val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
                $($(elem).slider("getElement")).parent().addClass("d-none")
            })
            hermetic_difficulty.parent().removeClass("d-none")
            hermetic_mr_difficulty.parent().removeClass("d-none")
            hermetic_talent.parent().parent().removeClass("d-none")
            name.addClass("d-none")
            handle.addClass("d-none")
            difficulty.parent().addClass("d-none")

            // Fix hermetic formula to body + action + humanoid
            const checked_radio_buttons = radio_buttons.filter(":checked")
            checked_radio_buttons.each((i, elem) => {
                $(elem).trigger("click").trigger("change")
            })
            const hermetic_test = $([this.get("mind")[0], this.get("action")[0], this.get("humanoid")[0]])
            hermetic_test.each((i, elem) => {
                $(elem).trigger("click").trigger("change")
            })
            radio_buttons.prop("disabled", true)[0].setAttribute("disabled", "")
        } else if (list.val() && good_nature_evil_energies.includes(list.val())) {
            radio_buttons.parent().children().addClass("d-none")
            const checked_radio_buttons = radio_buttons.filter(":checked")
            checked_radio_buttons.each((i, elem) => {
                $(elem).trigger("click").trigger("change")
            })
        } else {
            // Other mage lists
            slider.each((i, elem) => {
                $(elem).slider("enable").slider("refresh", {useCurrentValue: true})
                $($(elem).slider("getElement")).parent().removeClass("d-none")
            })
        }

        $("select.spell-list").each((i, elem) => {
            if (good_nature_evil_energies.includes($(elem).val())) {
                dice_3.removeClass("d-none")
                dice_3.prev().removeClass("d-none")
            }
        })

        // Update spell value
        this.update_roll_value()

        // Update spell selects if they don't show a given energy
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })

        // Update adventure points
        compute_remaining_ap()
    }
}

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

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        const formula_elements = this.compute_formula()[1]
        const roll_reason = this.get("name").val()
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

        // Do the actual roll
        new SuperpowerRoll(roll_reason, nbr_dices, under_value, formula_elements, power_distance, power_focus,
            power_duration, this.get("effect").val()).trigger_roll()
        $('#roll-dialog').modal()
    }
}

class TalentRollTable extends DataTable {
    static row_class = RollRow

    trigger_roll(event) {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass("row-roll-trigger"))
            button = $(event.target).parents(".row-roll-trigger")
        row_of(button).roll(button)
    }

    formula_changed(e) {
        e.preventDefault()
        row_of(e.target).update_roll_value()
    }

    select_changed(e) {
        row_of(e.target).update_roll_value()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        add_save_to_dom_listeners(row.data)
        row.data.find(".row-roll-trigger").uon("click", this.trigger_roll)
        row.data.find(".formula-elem").uon("change", this.formula_changed)
        row.data.find("select").uon("changed.bs.select", this.select_changed)
        row.data.find("select.talent-select").each((i, elem) => {
            $(elem).selectpicker()
        })
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }
}

class SpellRollTable extends TalentRollTable {
    static row_class = SpellRow

    formula_changed(e) {
        e.preventDefault()
        const spell = row_of(e.target)
        if (e.target.getAttribute("name").includes("-realm")) {
            spell.data.find("[name*=\"-realm\"]").each((i, elem) => {
                spell.update_realm($(elem))
            })
        }
        spell.update_roll_value()
    }

    select_changed(e) {
        super.select_changed(e)
        compute_remaining_ap()
    }

    update_level(e) {
        row_of(e.target).update_roll_value()
        compute_remaining_ap()
    }

    update_spell_name() {
        // Update selections of spells
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
        compute_remaining_ap()
    }

    update_difficulty_slider(event) {
        row_of(event.target).update_roll_value()
        // Update selections of spells because they depend on the level
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
    }

    update_spell_value(event) {
        row_of(event.target).update_roll_value()
    }

    update_list(event) {
        row_of(event.target).update_list()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.data.find(".spell-name").uon("change", this.update_spell_name)
        row.data.find(".spell-level").uon("change", this.update_level)
        row.data.find("select.spell-list").uon("changed.bs.select", this.update_list)
        row.data.find(".spell-difficulty-input").uon("change", this.update_difficulty_slider)
        row.data.find(".hermetic-difficulty").uon("change", this.update_spell_value)
        row.data.find(".hermetic-mr-learning").uon("change", this.update_spell_value)

        row.data.find("[id*=\"-difficulty-input\"").each((i, elem) => {
            activate_slider(elem, this.show_difficulty_builder)
        })
        row.get("talent").selectpicker()
        row.get("list").selectpicker({sanitize: false})
    }

    remove_row(event) {
        super.remove_row(event)
        // Update selections of spells
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
        compute_remaining_ap()
    }

    show_difficulty_builder(input) {
        const spell = row_of(input)
        return value => {
            const max = slider_max(input)
            const difficulty_elem = spell.get("difficulty", input)
            let difficulty // Use the count of the spell casted to compute difficulty
            if (value < 4)
                difficulty = -4
            else if (value <= 6)
                difficulty = -3
            else if (value <= 8)
                difficulty = -2
            else if (value === 9)
                difficulty = -1
            else if (value <= 19)
                difficulty = 0
            else if (value <= 29)
                difficulty = 1
            else
                difficulty = 2
            difficulty_elem.text(difficulty)
            return value + "/" + max
        }
    }
}

class KiTable extends SpellRollTable {
    static row_class = KiRow

    update_level(e) {
        row_of(e.target).update_level()
        super.update_level(e)
    }
}

class PsiRollTable extends SpellRollTable {

    show_difficulty_builder(input) {
        const spell = row_of(input)
        return value => {
            spell.get("difficulty", input).text(value)
            return "0"
        }
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
        $(".spell-value.roll-value,.dual_wielding-value").each((i, elem) => {
            row_of(elem).update_roll_value()
        })
    }

    input_change(e) {
        row_of(e.target).update_roll_value()
    }

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.get("component-modifier").uon("change", this.input_change)
        row.get("means-modifier").uon("change", this.input_change)
    }

    clone_row() {
        return this.template_row.clone(true, false)
    }
}

const talent_list_selector = ".talent input[id*='-name']"

/* Helper functions */

function get_magical_energies() {
    return $("input.magical-energy").map((i, input) => {
        const energy_image = $(input).parent().find(".input-prefix").clone(true, false)
        energy_image.removeClass("input-prefix").attr("height", "1em").attr("width", "1em")
        const energy_name = $("label[for='" + input.id + "']").text()
        return {
            name: energy_name,
            content: energy_image.length > 0 ? energy_image[0].outerHTML + "&nbsp;" + energy_name : null
        }
    }).filter((i, elem) => {
        return elem.name && elem.name.length > 0
    })
}

function init_spell_list(input) {
    const list = get_magical_energies()
    list.push({
        name: instinctive_magic,
        content: "<svg height=\"1em\" width=\"1em\">" +
            "<use xlink:href=\"#svg-instincts\"></use>" +
            "</svg>&nbsp;" + instinctive_magic
    })
    update_select($(input), list)
}

const hobbit_regexes = [/[Hh]obbits?/, /[Tt]inigens?/, /[Pp]etites [Gg]ens/, /[Pp]etites? [Pp]ersonnes?/,
    /[Tt]omt[eé]s?/]

function is_hobbit() {
    const race = $("#race").val()
    if (!race || race.length === 0)
        return false
    for (let i in hobbit_regexes) {
        if (race.match(hobbit_regexes[i]) != null)
            return true
    }
    return false
}

/* Triggers */

$("#race,.realm,.component,.means," + talent_list_selector).on("change", e => {
    // Update all of the spell values
    $(".spell-value,.superpower,.roll-value,.dual_wielding-value").each((i, elem) => {
        row_of(elem).update_roll_value()
    })
})

$("#spell-margin-good-nature-evil-1d3").on("click", _ => {
    const dice_value = roll_dices(1, 3)
    $("#spell-margin-good-nature-evil-1d3-result").text("1d3: " + dice_value)
})

$(_ => {
    // Initialize spell lists
    $("select.spell-list").each((i, input) => {
        init_spell_list(input)
    })

    // Initialize tables
    new TalentRollTable($("#roll-table"))
    new TalentRollTable($("#dual_wielding-table"))
    new SpellRollTable($("#spell-table"))
    new KiTable($("#ki-table"))
    new PsiRollTable($("#psi-table"))
    new SuperpowerRollTable($("#superpower-table"))
})
