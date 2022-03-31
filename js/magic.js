const priest_energy = "Divin"
const hermetic_energy = "Hermétique"
const instinctive_magic = "Magie instinctive"
const good_nature_evil_energies = ["Bien", "Mal", "Nature"]

class SpellRow extends RollRow {
    static radio_groups = {
        "component": Characteristics.components,
        "means": Characteristics.means,
    }
    static independent_checkboxes = [...Characteristics.realms, ...this.v7_checkboxes, "details-equipment-always-expend"]
    static selects_no_sanitize = ["list"]
    static selects = [...super.selects, ...["list"]]
    static sliders = ["difficulty-input"]
    static numeric_inputs = [...super.numeric_inputs, "level", "hermetic-mr-learning", "hermetic-difficulty", "details-equipment-always-expend-quantity"]
    static basic_inputs = [...this.numeric_inputs, ...["name", "time", "distance", "duration", "effect",
        "details-max", "details-min", "details-black-magic", "details-resistance", "details-ap-cost"]]
    static duplicated_inputs = {
        "hermetic-mr-learning": Characteristics.realms,
        "hermetic-difficulty": Characteristics.realms,
        "difficulty-input": Characteristics.realms,
    }

    static convert_casts_to_difficulty(value) {
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
        return difficulty
    }

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

    get_group(group_div) {
        return this.realm(group_div)
    }

    get_var(element_id_suffix, group_div) {
        const sub_id = element_id_suffix + "-" + (typeof group_div === "string" ? group_div : this.get_group(group_div))
        return this[sub_id] !== undefined ? this[sub_id] : this[element_id_suffix]
    }

    uses_talent(talent) {
        return this.is_talent_based_spell() && this["talent"] === talent.name
    }

    is_talent_based_spell() {
        return this.is_hermetic_spell()
    }

    is_hermetic_spell() {
        return this.list && this.list.trim() === hermetic_energy
    }

    is_instinctive_magic() {
        return this.list && this.list.trim() === instinctive_magic
    }

    is_priest_magic() {
        return this.list && this.list.trim() === priest_energy
    }

    is_evil_nature_good() {
        return this.list && good_nature_evil_energies.includes(this.list.trim())
    }

    filter_invisible_dices(i, elem) {
        return elem && !$(elem).hasClass("d-none") && !$(elem).parents(".spell-value-row").hasClass("d-none")
    }

    get_difficulty(realm) {
        return this.constructor.convert_casts_to_difficulty(this.get_var("difficulty-input", realm))
    }

    update_roll_value(dive_div) {
        if (this.is_evil_nature_good())
            return
        dive_div = $(dive_div)
        dive_div = (dive_div.length > 0) ? dive_div : this.find(".row-roll-trigger")
        dive_div.filter(this.filter_invisible_dices).each((i, dice_div) => {
            let sum = 0
            const realm = this.realm(dice_div)

            // Recover component, means and realm
            const formula = this.compute_formula(realm)[0]
            sum += formula
            sum += this["details-bonus"]

            // Recover difficulty
            sum += this.get_difficulty(dice_div)

            if (this.is_talent_based_spell()) {
                // Recover hermetic difficulty
                sum += this.get_var("hermetic-difficulty", dice_div) || 0
                // Recover associated talent level
                const name = this["talent"]
                if (name) {
                    const talent = sheet.get_talent_from_name(name)
                    // This is complicated because hermetic spells can have a penalty when they are not learned correctly
                    // (MR < 0) and this penalty can be outside of the talent levels, like -6 or -3
                    // However, once the talent is raised for the first time, this odd penalty disappears
                    let level = parseInt(talent.talent_level())
                    let origin_level = parseInt(talent.base_level)
                    let mr_learning = this.get_var("hermetic-mr-learning", dice_div) || 0

                    // For hermetic spells, a level "X" does not mean that they cannot cast the spell (though it will be difficult)
                    if (isNaN(level))
                        level = this.is_hermetic_spell() ? -5 : "X"
                    if (isNaN(origin_level))
                        origin_level = this.is_hermetic_spell() ? -5 : "X"

                    if (level === origin_level && mr_learning < 0) {
                        // Did not pay the learning failure at least once
                        // Note that mr_learning already includes the talent level
                        // (that is the closest feasible talent column, rounded up),
                        // thus we don't add it twice
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
                sum += sheet.status.get_unease()

            // Update
            this.get("value", dice_div).text(sum)
            dice_div.removeAttribute("hidden")
        })
    }

    get_level(button) {
        return this.get_var("level", button)
    }

    roll_reason() {
        if (!this.is_talent_based_spell()) {
            return this["name"]
        }
        const title = this["talent"]
        return title ? title : ""
    }

    energy_name() {
        return this["list"]
    }

    roll(button) {
        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let critical_increase = 0
        const realm = this.realm(button)
        const spell_difficulty = this.get_difficulty(button)
        const formula_elements = this.compute_formula(realm)[1]
        let margin_throttle = NaN
        if (!this.is_talent_based_spell()) { // Spell
            difficulty = spell_difficulty
            margin_throttle = this.is_instinctive_magic() ? 1 : NaN
        } else { // Talent
            difficulty = this["talent"] ? parseInt(sheet.get_talent_from_name(this["talent"]).talent_level()) : 0
        }
        let spell_distance = this.get_var("distance", button)
        let spell_focus = this.get_var("time", button)
        let spell_duration = this.get_var("duration", button)
        let spell_level = this.get_level(button)
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Equipment linked to the roll
        const equipment = this["equipment"] ? sheet.get_equipment(this["equipment"]) : null

        // Do the actual roll
        if (this.is_evil_nature_good()) {
            new GoodNatureEvilMagicRoll(this.roll_reason(), this.get_var("effect", button),
                spell_distance, spell_focus, spell_duration, spell_level,
                this["details-black-magic"],
                this["details-resistance"], equipment, this["details-equipment-always-expend"],
                this["details-equipment-always-expend-quantity"],
                this["details-exploding-effect"], this.energy_name()).trigger_roll()
        } else {
            const value = parseInt(this.get("value", button).text())
            const type = this.data[0].id.includes("psi-") ? PsiRoll
                : (this.data[0].id.includes("warrior-") ? WarriorRoll : TalentRoll)
            new type(this.roll_reason(), value, difficulty, this.get_var("effect", button),
                critical_increase, formula_elements, margin_throttle, this.data.hasClass("spell"),
                true, spell_distance, spell_focus, spell_duration, spell_level,
                this["details-black-magic"], this["details-resistance"], equipment,
                this["details-equipment-always-expend"], this["details-equipment-always-expend-quantity"],
                false, this["details-exploding-effect"], this.energy_name()).trigger_roll()
        }
    }

    update_realm(realm_div) {
        const spell_difficulty_inputs = this.get("difficulty-input", realm_div).parents(".spell-difficulty-row")
        const spell_value = this.get("value", realm_div).parents(".spell-value-row")
        const spell_difficulty = spell_difficulty_inputs.prev()
        const inline_realms = this.find("input[name*=-realm]:checked").length
        if (realm_div.prop("checked")) { // Show the checked realm-related variables
            spell_difficulty_inputs.removeClass("d-none")
            spell_difficulty.removeClass("d-none")
            spell_value.removeClass("d-none")
            spell_difficulty_inputs.parent().removeClass("hide-data-title")
        } else {
            spell_difficulty_inputs.addClass("d-none")
            spell_difficulty.addClass("d-none")
            spell_value.addClass("d-none")
            if (inline_realms === 0)
                spell_difficulty_inputs.parent().addClass("hide-data-title")
        }
        if (inline_realms > 1) {
            this.find(".spell-realm").removeClass("d-none")
        } else {
            this.find(".spell-realm").addClass("d-none")
        }

        // Update adventure points
        compute_remaining_ap()
    }

    update_list() {
        const slider = this.find(".spell-difficulty-input")
        if (slider.length === 0 || slider[0].id.includes("-x-"))
            return
        const radio_buttons = this.find(".formula-elem")
        const difficulty = this.find(".spell-difficulty-value")
        const hermetic_difficulty = this.find(".hermetic-difficulty")
        const hermetic_mr_difficulty = this.find(".hermetic-mr-learning")
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
        handle.addClass("d-md-inline")
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
            handle.removeClass("d-md-inline")
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
                $(elem).slider("enable")
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

    formula_changed(e) {
        e.preventDefault()
        if (e.target.getAttribute("name").includes("-realm")) {
            this.update_realm($(e.target))
            this.update_roll_value(this.get("dice", $(e.target)))
        } else {
            this.update_roll_value()
        }
    }

    select_changed(e) {
        super.select_changed(e)
        compute_remaining_ap()
    }

    update_level(e) {
        this.update_roll_value()
        compute_remaining_ap()
    }

    update_spell_name() {
        // Update selections of spells
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
        compute_remaining_ap()
    }

    update_difficulty_slider() {
        this.update_roll_value()
        // Update selections of spells because they depend on the level
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
    }

    add_listeners() {
        super.add_listeners()

        if (!this.is_template()) {
            this.get("name").on("change", e => this.update_spell_name(e))
            this.get("details-ap-cost").on("change", compute_remaining_ap)

            // The other fields can appear multiple times by row
            this.find(".spell-level").on("change", e => this.update_level(e))
            this.find("select.spell-list").on("changed.bs.select", e => this.update_list(e))
            this.find(".hermetic-difficulty").on("change", e => this.update_value(e))
            this.find(".hermetic-mr-learning").on("change", e => this.update_value(e))

            this.find("[id*=\"-difficulty-input\"").each((i, elem) => {
                activate_slider(elem, e => this.show_difficulty_builder(e), _ => void 0, {},
                    (e) => this.update_difficulty_slider(e))
            })
        }
    }

    show_difficulty_builder(input) {
        return value => {
            const max = slider_max(input)
            const difficulty_elem = this.get("difficulty", input)
            difficulty_elem.text(this.constructor.convert_casts_to_difficulty(value))
            return value + "/" + max
        }
    }
}

class FocusMagicRow extends SpellRow {
    static radio_groups = {}
    static independent_checkboxes = [...this.v7_checkboxes, "details-equipment-always-expend"]
    static selects_no_sanitize = []
    static selects = ["equipment"]
    static numeric_inputs = [...RollRow.numeric_inputs, "level", "details-equipment-always-expend-quantity"]
    static basic_inputs = [...this.numeric_inputs, ...["name", "focus", "time", "distance", "duration", "effect",
        "details-max", "details-min", "details-black-magic", "details-resistance", "details-ap-cost"]]
    static sliders = []
    static duplicated_inputs = {}

    static formula = ["mind", "action", "void"]
    static magic_talent = "Art magique"

    static magic_talent_level() {
        const talent = sheet.get_talent_from_name(this.magic_talent)
        let level = NaN
        if (talent) {
            level = parseInt(talent.talent_level())
        }
        if (isNaN(level)) {
            return "X"
        }
        return level
    }

    uses_talent(talent) {
        return talent.name === this.constructor.magic_talent
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
            value += sheet.characteristics[this.constructor.formula[i]]
        }
        // Super heroes have bonuses on all tests based on their component power
        const bonus = (components.includes(this.constructor.formula[0])) ? 4 : 0
        return [bonus + value, []]
    }

    update_roll_value(dice_div = $()) {
        dice_div = $(dice_div)
        dice_div = (dice_div.length > 0) ? dice_div : this.find(".row-roll-trigger")
        dice_div.filter(this.filter_invisible_dices).each(() => {
            let sum = this["details-bonus"]

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
                sum += sheet.status.get_unease()

            // Update
            this.get("value").text(sum)
        })
    }

    roll_reason() {
        return this["name"]
    }

    roll(button) {
        // Equipment linked to the roll
        const equipment = this["equipment"] ? sheet.get_equipment(this["equipment"]) : null

        // Do the actual roll
        const value = parseInt(this.get("value").text())
        let level = this.constructor.magic_talent_level()
        level = !isNaN(level) ? level : 0
        new FocusMagicRoll(this.roll_reason(), value, level, this["effect"], this["distance"],
            this["time"], this["duration"], this["level"], this["details-black-magic"], this["details-resistance"],
            equipment, this["details-equipment-always-expend"], this["details-equipment-always-expend-quantity"],
            this["details-exploding-effect"]).trigger_roll()
    }
}

class SpellRollTable extends TalentRollTable {
    static row_class = SpellRow

    remove_row(event) {
        super.remove_row(event)
        // Update selections of spells
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
        compute_remaining_ap()
    }
}

class FocusMagicRollTable extends SpellRollTable {
    static row_class = FocusMagicRow
}

class RuneRow extends DataRow {
    static basic_inputs = ["name", "meaning"]

    add_listeners() {
        super.add_listeners()

        if (!this.is_template())
            this.get("name").uon("change", compute_remaining_ap)
    }
}

class RuneTable extends DataList {
    static row_class = RuneRow
    static basic_inputs = ["name", "meaning"]

    add_row(fixed_idx = null) {
        super.add_row(fixed_idx)
        compute_remaining_ap() // Each rune cost AP
    }
}

class WordRow extends RuneRow {
    static selects = ["type"]
    static basic_inputs = ["name"]

    add_listeners() {
        super.add_listeners()

        if (!this.is_template())
            this.get("type").uon("changed.bs.select", compute_remaining_ap)
    }
}

class WordTable extends RuneTable {
    static row_class = WordRow
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

let spell_list = []

function init_spell_list(input, regenerate = false) {
    if (spell_list.length === 0 || regenerate) {
        spell_list = get_magical_energies()
        spell_list.push({
            name: instinctive_magic,
            content: "<svg height=\"1em\" width=\"1em\">" +
                "<use xlink:href=\"#svg-instincts\"></use>" +
                "</svg>&nbsp;" + instinctive_magic
        })
    }
    update_select($(input), spell_list)
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
