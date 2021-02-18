class SpellRow extends RollRow {

    realm(realm_based_div) {
        const realm_split = $(realm_based_div)[0].id.split("-")
        const realm = realm_split[realm_split.length - 1]
        return realm.match(realms) ? realm : ""
    }

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

    is_priest_magic() {
        const value = this.get("list").val()
        return value && value.trim() === priest_energy
    }

    is_evil_nature_good() {
        const value = this.get("list").val()
        return value && good_nature_evil_energies.includes(value.trim())
    }

    filter_invisible_dices(i, elem) {
        return elem && !$(elem).hasClass("d-none") && !$(elem).parents(".spell-value-row").hasClass("d-none")
    }

    update_roll_value(dive_div) {
        if (this.is_evil_nature_good())
            return
        dive_div = $(dive_div)
        dive_div = (dive_div.length > 0) ? dive_div : this.data.find(".row-roll-trigger")
        dive_div.filter(this.filter_invisible_dices).each((i, dice_div) => {
            let sum = 0
            const realm = this.realm(dice_div)

            // Recover component, means and realm
            const formula = this.compute_formula(realm)[0]
            sum += formula

            const bonus = this.get("details-bonus", dice_div)
            if (bonus.length > 0 && !isNaN(parseInt(bonus.val()))) {
                sum += parseInt(bonus.val())
            }

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

            // Optional min and max
            sum = this.cap_roll_value(sum)

            // Unease is applied at the end
            if (!isNaN(sum))
                sum += get_unease()

            // Update
            this.get("value", dice_div).text(sum)
            dice_div.removeAttribute("hidden")
        })
    }

    level(button) {
        return this.get("level", button).val()
    }

    roll_reason() {
        if (!this.is_talent_based_spell()) { // Spell
            return this.get("name").val()
        }
        const talent_select = this.get("talent")
        return talent_select.find("option:selected").val()
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let critical_increase = 0
        const realm = this.realm(button)
        const spell_difficulty = this.get("difficulty", button)
        const formula_elements = this.compute_formula(realm)[1]
        let margin_throttle = NaN
        if (!this.is_talent_based_spell()) { // Spell
            difficulty = parseInt(spell_difficulty.text())
            margin_throttle = this.is_instinctive_magic(button[0]) ? 1 : NaN
        } else { // Talent
            const talent_select = this.get("talent", button)
            const talent = talent_select.find("option:selected").val()
            difficulty = parseInt(talent_level(talent_from_name(talent)))
        }
        let spell_distance = this.get("distance", button).val()
        let spell_focus = this.get("time", button).val()
        let spell_duration = this.get("duration", button).val()
        let spell_level = this.level(button)
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Do the actual roll
        if (this.is_evil_nature_good()) {
            new GoodNatureEvilMagicRoll(this.roll_reason(), this.get("effect", button).val(),
                spell_distance, spell_focus, spell_duration, spell_level,
                this.get("details-black-magic", button).val(),
                this.get("details-resistance", button).val()).trigger_roll()
        } else {
            const value = parseInt(this.get("value", button).text())
            const type = this.data[0].id.includes("psi-") ? PsiRoll : TalentRoll
            new type(this.roll_reason(), value, difficulty, this.get("effect", button).val(),
                critical_increase, formula_elements, margin_throttle, this.data.hasClass("spell"),
                true, spell_distance, spell_focus, spell_duration, spell_level,
                this.get("details-black-magic", button).val(),
                this.get("details-resistance", button).val()).trigger_roll()
        }
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
        const dice_3 = this.get("dice-evil-nature-good")

        // Reset visibility of elements
        dice_3.addClass("d-none")
        radio_buttons.prop("disabled", false).removeAttr("disabled")
        radio_buttons.parent().children().removeClass("d-none")
        hermetic_difficulty.parent().addClass("d-none")
        hermetic_mr_difficulty.parent().addClass("d-none")
        hermetic_talent.parent().parent().addClass("d-none")
        name.removeClass("d-none")
        handle.removeClass("d-none")
        difficulty.parent().removeClass("d-none")

        if (this.is_instinctive_magic() || this.is_priest_magic()) {
            // Fix the level to 0 if divine energy
            slider.each((i, elem) => {
                $(elem).val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
                $($(elem).slider("getElement")).parent().addClass("d-none")
            })
        } else if (this.is_hermetic_spell()) {
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
        } else if (this.is_evil_nature_good()) {
            radio_buttons.parent().children().addClass("d-none")
            const checked_radio_buttons = radio_buttons.filter(":checked")
            checked_radio_buttons.each((i, elem) => {
                $(elem).trigger("click").trigger("change")
            })
            dice_3.removeClass("d-none")
        } else {
            // Other mage lists
            slider.each((i, elem) => {
                $(elem).slider("enable").slider("refresh", {useCurrentValue: true})
                $($(elem).slider("getElement")).parent().removeClass("d-none")
            })
        }

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

class FocusMagicRow extends SpellRow {
    static formula = ["mind", "action", "void"]
    static magic_talent = "Art magique"

    static magic_talent_level() {
        const talent = talent_from_name(this.magic_talent)
        let level = NaN
        if (talent.length > 0) {
            level = parseInt(talent_level(talent[0]))
        }
        if (isNaN(level)) {
            return "X"
        }
        return level
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

    compute_formula() {
        let value = 0
        const components = SuperpowerRollTable.components()
        for (let i = 0; i < this.constructor.formula.length; i++) {
            value += parseInt($("#" + this.constructor.formula[i]).val())
        }
        // Super heroes have bonuses on all tests based on their component power
        const bonus = (components.includes(this.constructor.formula[0])) ? 4 : 0
        return [bonus + value, []]
    }

    update_roll_value(dice_div = $()) {
        dice_div = $(dice_div)
        dice_div = (dice_div.length > 0) ? dice_div : this.data.find(".row-roll-trigger")
        dice_div.filter(this.filter_invisible_dices).each(() => {
            let sum = 0

            const bonus = this.get("details-bonus")
            if (bonus.length > 0 && !isNaN(parseInt(bonus.val()))) {
                sum += parseInt(bonus.val())
            }

            // Recover component, means and realm
            const formula = this.compute_formula()[0]
            sum += formula

            // Recover associated talent level
            let level = this.constructor.magic_talent_level()
            if (!isNaN(level)) {
                sum += level
            } else {
                sum = "X"
            }

            // Optional min and max
            sum = this.cap_roll_value(sum)

            // Unease is applied at the end
            if (!isNaN(sum))
                sum += get_unease()

            // Update
            this.get("value").text(sum)
        })
    }

    roll_reason() {
        return this.get("name").val()
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let spell_distance = this.get("distance").val()
        let spell_focus = this.get("time").val()
        let spell_duration = this.get("duration").val()
        let spell_level = this.get("level").val()

        // Do the actual roll
        const value = parseInt(this.get("value").text())
        let level = this.constructor.magic_talent_level()
        level = !isNaN(level) ? level : 0
        new FocusMagicRoll(this.roll_reason(), value, level, this.get("effect").val(), spell_distance,
            spell_focus, spell_duration, spell_level, this.get("details-black-magic", button).val(),
            this.get("details-resistance", button).val()).trigger_roll()
        $('#roll-dialog').modal()
    }
}

class SpellRollTable extends TalentRollTable {
    static row_class = SpellRow

    formula_changed(e) {
        e.preventDefault()
        const spell = row_of(e.target)
        if (e.target.getAttribute("name").includes("-realm")) {
            spell.update_realm($(e.target))
            spell.update_roll_value(spell.get("dice", $(e.target)))
        }
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

    update_value(event) {
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
        row.data.find(".hermetic-difficulty").uon("change", this.update_value)
        row.data.find(".hermetic-mr-learning").uon("change", this.update_value)

        row.data.find("[id*=\"-difficulty-input\"").each((i, elem) => {
            activate_slider(elem, this.show_difficulty_builder, _ => void 0, {},
                this.update_difficulty_slider)
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
        return value => {
            const spell = row_of(input)
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

class FocusMagicRollTable extends SpellRollTable {
    static row_class = FocusMagicRow

    add_custom_listener_to_row(row) {
        super.add_custom_listener_to_row(row)
        row.update_roll_value()
    }
}

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

/* Triggers */

function toggle_energy_dependent_table(energy, table_body) {
    const toggle_button = $("[data-hide-table='#" + table_body.get(0).id + "']")
    if (parseInt(energy.val()) >= 1 && toggle_button.hasClass("d-none")) {
        toggle_button.removeClass("d-none")
        if (toggle_button.hasClass("btn-dark"))
            toggle_button.click()
    } else if (parseInt(energy.val()) === 0 && !toggle_button.hasClass("d-none")) {
        if (toggle_button.hasClass("btn-light"))
            toggle_button.click()
        toggle_button.addClass("d-none")
    }
}

$("#name-magic").on("change", e => {
    toggle_energy_dependent_table($(e.target), $("#word-table"))
})

$("#runes").on("change", e => {
    toggle_energy_dependent_table($(e.target), $("#rune-table"))
})

$("#magic-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    search_tables(value, $("#spell-table tr,#focusMagic-table tr,#rune-table tr,#word-table tr"))
})
