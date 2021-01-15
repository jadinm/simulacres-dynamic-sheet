/* Rolls and spells */

const talent_list_selector = ".talent input[id*='-name']"

/* Spell-related */

function add_row_listeners(line = $(document)) {
    add_save_to_dom_listeners(line)
    line.find(".spell-name").on("change", _ => {
        compute_remaining_ap()
    })
    line.find(".spell-list").on("changed.bs.select", list_changed)
    line.find(".spell-formula-elem").on("change", event => {
        event.preventDefault()
        update_spell_value(row_elem(event.target, "value"))
    })
    line.find(".spell-difficulty-input").on("change", event => {
        update_spell_value(row_elem(event.target, "value"))
    })
    line.find(".hermetic-difficulty").on("change", event => {
        update_spell_value(row_elem(event.target, "value"))
    })
    line.find(".spell-talent").each((i, elem) => {
        if (!elem.id.includes("-x-")) {
            $(elem).on("changed.bs.select", e => {
                update_spell_value(row_elem(e.target, "value"))
            })
        }
    })
    line.find(".row-roll-trigger").on("click", event => {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass("row-roll-trigger"))
            button = $(event.target).parents(".row-roll-trigger")

        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        let roll_reason
        let critical_increase = 0
        const spell_difficulty = row_elem(button[0], "difficulty")
        const formula_elements = compute_formula(row(button[0]))[1]
        let margin_throttle = NaN
        const is_magic = spell_difficulty.length > 0
        if (is_magic && !is_hermetic_spell(button[0])) { // Spell
            difficulty = parseInt(spell_difficulty.text())
            roll_reason = row_elem(button[0], "name").val()
            margin_throttle = is_instinctive_magic(button[0]) ? 1 : NaN
        } else { // Talent
            const talent_select = row_elem(button[0], "talent")
            const talent = talent_select.find("option:selected").val()
            difficulty = parseInt(talent_level(talent_from_name(talent)))
            roll_reason = talent

            // Dual wielding
            const tap_talent_select = row_elem(button[0], "tap-talent")
            if (tap_talent_select.length > 0) {
                const tap_talent = tap_talent_select.find("option:selected").val()
                roll_reason = "Combat à deux armes: " + talent + " & " + tap_talent
                critical_increase += 1
            }
        }
        let spell_distance = ""
        let spell_duration = ""
        if (is_magic) {
            spell_duration = row_elem(button[0], "time").val()
            spell_distance = row_elem(button[0], "distance").val()
        }
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Reset all invested energies
        $(".roll-dialog-energy").val(0)

        // Do the actual roll
        const value = parseInt(row_elem(button[0], "value").text()) // Recover max value
        new Roll(roll_reason, value, difficulty, row_elem(button[0], "effect").val(),
            critical_increase, formula_elements, margin_throttle, is_magic, spell_distance,
            spell_duration).trigger_roll()
        $('#roll-dialog').modal()
    })
    line.find(".roll-formula-elem,.dual_wielding-formula-elem").on("change", e => {
        e.preventDefault()
        roll_changed(e)
    })
    line.find(".roll-talent,.dual_wielding-talent,.dual_wielding-tap-talent").each((i, elem) => {
        if (!elem.id.includes("-x-")) {
            $(elem).on("changed.bs.select", e => {
                roll_changed(e)
            })
        }
    })
}

function get_magical_energies() {
    return $("input.magical-energy").map((i, input) => {
        return $("label[for='" + input.id + "']").text()
    }).filter((i, elem) => {
        return elem && elem.length > 0
    })
}

function init_spell_list(input) {
    const list = get_magical_energies()
    list.push(instinctive_magic)
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

function compute_formula(row) {
    const elements = ["component", "means", "realm"]
    let sum = 0
    const checked_elements = []
    for (let i = 0; i < elements.length; i++) {
        const elem_name = row[0].id + "-" + elements[i]
        const checked_elem = $("input[name=" + elem_name + "]:checked")
        if (checked_elem.length === 0)
            continue  // Allow partial formulas
        checked_elements.push(checked_elem)
        const base_array = checked_elem[0].id.split("-")
        const formula_base_name = base_array[base_array.length - 1]
        if (formula_base_name === "resistance" && is_hobbit()) {
            sum += 1 // Hobbits have an increased resistance
        }
        sum += parseInt($("#" + formula_base_name).val())
    }
    return [sum, checked_elements]
}

function is_hermetic_spell(value_div) {
    const value = row_elem(value_div, "list").val()
    return value && value.trim() === hermetic_energy
}

function is_instinctive_magic(value_div) {
    const value = row_elem(value_div, "list").val()
    return value && value.trim() === instinctive_magic
}

function update_spell_value(value_div) {
    let sum = 0

    // Recover component, means and realm
    const formula = compute_formula(row(value_div[0]))[0]
    sum += formula

    // Recover difficulty
    sum += parseInt(row_elem(value_div[0], "difficulty").text())

    if (is_hermetic_spell(value_div[0])) {
        // Recover hermetic difficulty
        const cast_diff = parseInt(row_elem(value_div[0], "hermetic-difficulty").val())
        if (!isNaN(cast_diff)) {
            sum += cast_diff
        }
        // Recover associated talent level
        const name = row_elem(value_div[0], "talent").val()
        if (name.length !== 0) {
            const level = parseInt(talent_level(talent_from_name(name)))
            if (isNaN(level)) {
                sum = "X"
            } else {
                sum += level
            }
        }
    }

    // Update
    value_div.text(sum)
    row_elem(value_div[0], "dice")[0].removeAttribute("hidden")
}

function list_changed(event) {
    // Fix the level to 0 if divine or ki energies
    const slider = row_elem(event.target, "difficulty-input")
    if (slider.length === 0 || slider[0].id.includes("-x-"))
        return

    const difficulty = row_elem(event.target, "difficulty")
    const hermetic_difficulty = row_elem(event.target, "hermetic-difficulty")
    const hermetic_talent = row_elem(event.target, "talent")
    const name = row_elem(event.target, "name")
    const handle = row_elem(event.target, "name-handle")
    hermetic_difficulty.parent().addClass("d-none")
    hermetic_talent.parent().parent().addClass("d-none")
    name.removeClass("d-none")
    handle.removeClass("d-none")
    difficulty.parent().removeClass("d-none")
    if ($(event.target).val() && ([priest_energy, instinctive_magic].includes($(event.target).val().trim()))) {
        slider.val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
        $(slider.slider("getElement")).parent().addClass("d-none")
    } else if ($(event.target).val() && $(event.target).val().trim() === hermetic_energy) {
        slider.val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
        $(slider.slider("getElement")).parent().addClass("d-none")
        hermetic_difficulty.parent().removeClass("d-none")
        hermetic_talent.parent().parent().removeClass("d-none")
        name.addClass("d-none")
        handle.addClass("d-none")
        difficulty.parent().addClass("d-none")
    } else {
        slider.slider("enable").slider("refresh", {useCurrentValue: true})
        $(slider.slider("getElement")).parent().removeClass("d-none")
    }

    // Update spell value
    update_spell_value(row_elem(slider[0], "value"))

    // Update adventure points
    compute_remaining_ap()
}

add_row_listeners()

/* Rolls-related */

function update_roll_value(value_div) {
    let sum = 0

    // Recover component, means and realm
    const formula = compute_formula(row(value_div[0]))[0]
    sum += formula

    // Add talent if any
    let talent = row_elem(value_div[0], "talent")
    if (talent.length === 0)
        return
    talent = talent.val()

    const talent_div = talent_from_name(talent)
    if (talent_div.length !== 0) {
        const level = talent_level(talent_div[0])
        if (level === "x")
            sum = "X"
        else
            sum += parseInt(level)
    }

    // Dual wielding: check tap talent level for penalty
    let tap_talent = row_elem(value_div[0], "tap-talent")
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
                sum += parseInt(level) - 2
        }
    }

    // Update
    value_div.text(sum)
    row_elem(value_div[0], "dice")[0].removeAttribute("hidden")
}

function roll_changed(event) {
    // Trigger update of the spell difficulty
    update_roll_value(row_elem(event.target, "value"))
}

/* Triggers */

$("#race,.realm,.component,.means," + talent_list_selector).on("change", _ => {
    // Update all of the spell values
    $(".spell-value").each((i, elem) => {
        update_spell_value($(elem))
    })
    // Update all the rolls
    $(".roll-value,.dual_wielding-value").each((i, elem) => {
        update_roll_value($(elem))
    })
})

/* Update sliders on load */

function show_difficulty_builder(input) {
    return value => {
        const max = slider_max(input)
        const difficulty_elem = $("#" + input.id.slice(0, -6))
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

$(_ => {
    $('.spell-difficulty-input').each((i, input) => {
        activate_slider(input, show_difficulty_builder)
    })

    // Initialize spell lists
    $(".spell-list").each((i, input) => {
        init_spell_list(input)
    })
})

/* Add buttons */

$("#add-spell").on("click", (event, idx = null) => { // Add parameter for forced index
    const table = $("#spell-table")

    // We have to reset listeners because of the slider
    const new_spell = $("#spell-x").clone(true, false)

    // Find all elements that have id containing old value
    new_spell.find("input").each((i, elem) => {
        elem.value = ""
        $(elem).trigger("change")
    })

    const new_id = add_row(table, new_spell, idx)
    activate_slider(new_spell.find("#spell-" + new_id + "-difficulty-input")[0], show_difficulty_builder)

    new_spell.find("#spell-" + new_id + "-talent").selectpicker()
    new_spell.find("#spell-" + new_id + "-list").selectpicker()
    add_row_listeners(new_spell)
})

$("#add-roll").on("click", (event, idx = null) => { // Add parameter for forced index
    const new_row = $("#roll-x").clone(true, false)

    const new_id = add_row($("#roll-table"), new_row, idx)
    const select = new_row.find("#roll-" + new_id + "-talent")
    select.selectpicker()

    // Reset all the listeners
    new_row.find("input").each((i, elem) => {
        elem.value = ""
        $(elem).trigger("change")
    })
    add_row_listeners()
})

$("#add-dual_wielding").on("click", (event, idx = null) => { // Add parameter for forced index
    const new_row = $("#dual_wielding-x").clone(true, false)

    const new_id = add_row($("#dual_wielding-table"), new_row, idx)
    const select = new_row.find("#dual_wielding-" + new_id + "-talent")
    select.selectpicker()
    const select_tap = new_row.find("#dual_wielding-" + new_id + "-tap-talent")
    select_tap.selectpicker()

    // Reset all the listeners
    new_row.find("input").each((i, elem) => {
        elem.value = ""
        $(elem).trigger("change")
    })
    add_row_listeners()
})

/* Actual roll */

function roll_dices(number = 2, type = 6, dices = null) {
    let sum = 0
    for (let i = 0; i < number; i++) {
        const single_roll = Math.floor(Math.random() * type) + 1
        if (dices)
            dices.push(single_roll)
        sum += single_roll
    }
    return sum
}

$("#roll-dialog-1d6").on("click", _ => {
    const dice_value = roll_dices(1)
    $("#roll-dialog-1d6-result").text("1d6 additionnel: " + dice_value)
})

$("#roll-dialog-2d6").on("click", _ => {
    const dice_value = roll_dices()
    $("#roll-dialog-2d6-result").text("2d6 additionnels: " + dice_value)
})

effect_table = {
    /*  0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 */
    A: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3],
    B: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4],
    C: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
    D: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
    E: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8],
    F: [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 3, 3, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8],
    G: [0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 7, 7, 7, 7, 9, 9, 9, 9],
    H: [0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 8, 8, 8, 8, 9, 9, 9, 9],
    I: [0, 0, 0, 1, 2, 2, 2, 4, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10],
    J: [0, 0, 0, 1, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12, 12],
    K: [0, 0, 0, 1, 3, 3, 3, 5, 5, 5, 5, 5, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12, 12],
}

effect_upgrade = {A: 1, B: 1, C: 2, D: 2, E: 2, F: 2, G: 3, H: 3, I: 4, J: 4, K: 6}

function set_result_label(margin) {
    if ((is_v7 && margin > 0 || !is_v7 && margin >= 0) && !critical_failure || critical_success) {
        $("#roll-dialog-result-label").html("Marge de réussite = ")
    } else {
        $("#roll-dialog-result-label").html("Marge d'échec = ")
    }
}

function has_any_base_energy() {
    return $("#power, #speed, #precision").filter((i, elem) => {
        return elem.value && parseInt(elem.value) > 0
    }).length > 0
}

const effect_column_regex = /(^|\W)\[([ABCDEFGHIJK])([+-]\d+)?](\W|$)/gi
const effect_margin_regex = /(^|\W)(MR)(\W|$)/gi
const effect_dss_regex = /(^|\W)(DSS)(\W|$)/gi
const effect_des_regex = /(^|\W)(DES)(\W|$)/gi

let critical_failure = false
let critical_success = false

const last_rolls = []
let current_roll = null

class Roll {
    constructor(reason = "", max_value = NaN, talent_level = 0, effect = "",
                critical_increase = 0, formula_elements = [], margin_throttle = NaN,
                is_magic = false, distance = "", duration = "",
                base_dices = [], critical_dices = [], effect_dices = [], power_dices = []) {
        this.reason = reason
        this.formula_elements = formula_elements
        this.max_value = max_value
        this.margin_throttle = margin_throttle
        this.talent_level = talent_level
        this.effect = effect
        this.base_dices = base_dices
        this.critical_dices = critical_dices
        this.effect_dices = effect_dices

        this.is_magic = is_magic
        this.distance = distance // Spell parameter increased by power
        this.duration = duration // Spell parameter decreased by speed

        this.critical_increase = critical_increase
        this.precision = NaN
        this.optional_precision = NaN
        this.power = NaN
        this.optional_power = NaN
        this.power_dices = power_dices
        this.magic_power = NaN
        this.speed = NaN
        this.optional_speed = NaN
        this.update_energies()

        this.unease = get_unease()
        this.armor_penalty = get_armor_penalty()
        this.timestamp = new Date()

        this.margin_modifier = 0
        this.effect_modifier = 0

        this.energy_investment_validated = !this.is_talent_roll() || !has_any_base_energy()

        // Add to the list of rolls
        last_rolls.push(this)
    }

    roll_dices(number, type, dices) {
        return roll_dices(number, type, dices)
    }

    column_effect(column, modifier) {
        const total = this.post_test_margin() + this.effect_value() + this.effect_modifier + modifier
        if (this.post_test_margin() < 0 || total < 0)
            return 0
        if (total > 26) {
            const additional_ranges = Math.floor((total - 26) / 4) + 1
            return effect_table[column][26] + effect_upgrade[column] * additional_ranges
        }
        return effect_table[column][total]
    }

    dss() {
        return this.post_test_margin() > 0 ? Math.floor(this.post_test_margin() / 3) : 0
    }

    des() {
        if (-6 <= this.post_test_margin() && this.post_test_margin() <= -4)
            return 1
        else if (this.post_test_margin() <= -7)
            return 2
        return 0
    }

    max_threshold() {
        return this.max_value + this.unease + this.power + this.speed + this.precision + this.margin_modifier
    }

    margin() {
        if (this.is_critical_failure()) // Cannot have more than 0 in case of critical failure
            return 0
        const margin = this.max_threshold() - this.dice_value() + this.critical_value()
        return isNaN(this.margin_throttle) ? margin : Math.min(this.margin_throttle, margin)
    }

    post_test_margin() {
        return this.is_success() ? this.margin() + this.power_value() : this.margin()
    }

    update_energy(input, current_value, force_update = false) {
        if (input.length > 0) {
            if (isNaN(current_value) || force_update) {
                current_value = parseInt(input.val())
            } else { // Update input
                input.val(current_value)
            }
        } else {
            current_value = 0
        }
        return current_value
    }

    update_energies(force_update = false) {
        const power_input = $("#roll-dialog-power")
        this.power = this.update_energy(power_input, this.power, force_update)
        const optional_power_input = $("#roll-dialog-optional-power")
        this.optional_power = optional_power_input.length > 0 ? this.update_energy(optional_power_input, this.optional_power, force_update) : this.power
        const magic_power_input = $("#roll-dialog-magic-power")
        this.magic_power = magic_power_input.length > 0 ? this.update_energy(magic_power_input, this.magic_power, force_update) : 0
        const speed_input = $("#roll-dialog-speed")
        this.speed = this.update_energy(speed_input, this.speed, force_update)
        const optional_speed_input = $("#roll-dialog-optional-speed")
        this.optional_speed = optional_speed_input.length > 0 ? this.update_energy(optional_speed_input, this.optional_speed, force_update) : this.speed
        const precision_input = $("#roll-dialog-precision")
        this.precision = this.update_energy(precision_input, this.precision, force_update)
        const optional_precision_input = $("#roll-dialog-optional-precision")
        this.optional_precision = optional_precision_input.length > 0 ? this.update_energy(optional_precision_input, this.optional_precision, force_update) : this.precision

        /* Update remaining max on energies */
        update_max_invested_energies($("#power")[0])
        update_max_invested_energies($("#speed")[0])
        update_max_invested_energies($("#precision")[0])
    }

    dice_value() {
        if (this.base_dices.length === 0) {
            // Roll needed
            this.roll_dices(2, 6, this.base_dices)
        }
        return this.base_dices.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    effect_value() {
        if (is_v7 && this.effect_dices.length === 0) {
            // Roll needed
            this.roll_dices(2, 6, this.effect_dices)
        }
        return this.effect_dices.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    critical_value() {
        if (!this.is_critical_success()) {
            return 0
        }
        if (this.critical_dices.length === 0) {
            const additional_dices = this.talent_level >= 0 ? this.talent_level : 0
            this.roll_dices(1 + additional_dices, 6, this.critical_dices)
        }
        return this.critical_dices.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    power_value() {
        if (!this.is_success())
            return 0
        if (this.power_dices.length === 0) {
            // Power can only be increased up to 3 => roll all the dices directly
            this.roll_dices(3, 6, this.power_dices)
        }
        return this.power_dices.slice(0, this.optional_power).reduce((a, b) => {
            return a + b;
        }, 0);
    }

    is_talent_roll() {
        return !isNaN(this.max_value)
    }

    is_critical_failure() {
        return this.dice_value() === 12
    }

    is_critical_success() {
        const precision = this.optional_precision == null ? 0 : this.optional_precision
        // talents at level -4 and -2 trigger a critical roll at the same probability as talents at level 0
        return this.dice_value() <= 2 + Math.max(0, this.talent_level) + precision + this.critical_increase
    }

    is_success() {
        return !this.is_critical_failure()
            && (this.margin() > 0 || this.margin() === 0 && !is_v7 || this.is_critical_success())
    }

    dice_buttons(dice_group, dices = []) {
        const digits = ["", "one", "two", "three", "four", "five", "six"]
        let text = "&nbsp;"
        for (let i in dices) {
            if (dices[i] > 0 && dices[i] <= 6)
                text += '<span class="clickable btn-link roll-link" data-dice-group="' + dice_group
                    + '" data-dice-idx="' + i + '" data-toggle="tooltip" data-placement="bottom" title="Relancer le dé">' +
                    '<i class="fas fa-lg fa-dice-' + digits[dices[i]] + '"></i></span>'
            else
                text += dices[i]
            if (parseInt(i) !== dices.length - 1)
                text += "&nbsp;<i class=\"fas fa-sm fa-plus mt-1\"></i>&nbsp;"
        }
        return text + "&nbsp;"
    }

    show_roll(ignore_sliders = false) {
        // Update current roll
        current_roll = this
        // Show roll navigation
        const forward = $("#roll-dialog-history-forward")
        forward.addClass("invisible")
        if (last_rolls[last_rolls.length - 1] !== this) {
            forward.removeClass("invisible")
        }
        const backward = $("#roll-dialog-history-backward")
        backward.addClass("invisible")
        if (last_rolls[0] !== this) {
            backward.removeClass("invisible")
        }

        // Reset text
        $("#roll-dialog-1d6-result").text("")
        $("#roll-dialog-2d6-result").text("")
        const critical_div = $("#roll-dialog-critical")
        critical_div.text("")

        // Check for critical rolls
        let text_end = ""
        let modifier = 0
        critical_failure = false
        critical_success = false
        this.update_energies()
        if (this.energy_investment_validated && this.is_critical_failure()) {
            critical_div.html("<b class='text-danger'>Échec critique... :'(</b>")
            text_end = "<div class='row mx-1 align-middle'>La marge est maximum 0 et c'est un échec</div>"
            critical_failure = true
        } else if (this.energy_investment_validated && this.is_critical_success()) {
            critical_div.html("<b class='text-success'>Succès critique !</b>")
            modifier = this.critical_value()
            text_end = "<div class='row mx-1 align-middle'>" + this.critical_dices.length + "d6 ajouté" + ((this.critical_dices.length > 1) ? "s" : "")
                + " à la marge d'une valeur de " + modifier + this.dice_buttons("critical_dices", this.critical_dices) + "</div>"
            critical_success = true
        }

        // Fill in penalties
        let penalty_text = ""
        if (this.unease !== 0) {
            penalty_text += "\nMalaise courant: " + this.unease + " (déjà appliqué)\n"
        }
        if (parseInt(this.armor_penalty) !== 0) {
            penalty_text += "\nMalaise d'armure: " + this.armor_penalty + " (cela s'applique sur les actions physiques)\n"
        }
        $("#roll-dialog-penalties").text(penalty_text)

        const select_modifier = $("#roll-dialog-modifier")
        const select_effect_modifier = $("#roll-dialog-effect-modifier")

        // Hide everything and show it afterwards if needed
        const roll_effect_divs = $(".roll-dialog-effect-hide")
        const roll_magic_divs = $(".roll-dialog-magic-hide")

        if (this.is_talent_roll()) {
            roll_effect_divs.removeClass("d-none")
            if (this.is_magic)
                roll_magic_divs.removeClass("d-none")
            else
                roll_magic_divs.addClass("d-none")

            const result = $("#roll-dialog-result")
            const energy_inputs = $(".roll-dialog-energy")
            let effect_text = isNaN(this.margin_throttle) ? "" : "<div class='row mx-1 align-middle'>La marge maximum est de "
                + this.margin_throttle + "</div>"
            if (this.energy_investment_validated) {
                const validate_button = $("#roll-dialog-validate")
                validate_button.addClass("d-none")
                energy_inputs.attr("disabled", "disabled")

                result[0].setAttribute("value", this.post_test_margin().toString())
                result.html(this.post_test_margin())

                set_result_label(this.post_test_margin())

                let effect_dices_sum = 0
                if (this.is_success() && this.optional_power > 0 && this.power_value() >= 0) {
                    effect_text += "<div id='roll-dialog-power-test' class='row mx-1 align-middle'>" + this.optional_power + "d6 de puissance rajoutés = "
                        + this.power_value() + this.dice_buttons("power_dices", this.power_dices.slice(0, this.optional_power)) + "</div>"
                }
                if (is_v7) {
                    // Roll the two additional dices
                    effect_dices_sum = this.effect_value()
                    effect_text += "<div class='row mx-1 align-middle'>Dés d'effet = " + effect_dices_sum
                        + this.dice_buttons("effect_dices", this.effect_dices) + "</div>"
                } else {
                    // DSS = MR // 3 and DES = 0 or (1 if 4 <= ME <= 6) or (2 if ME >= 7)
                    effect_text += "<div class='row mx-1 align-middle'>DSS =&nbsp;<span class='roll-dialog-dss'>" + this.dss()
                        + "</span></div><div class='row mx-1 align-middle'>DES =&nbsp;<span class='roll-dialog-des'>" + this.des() + "</span></div>"
                }
            } else {
                result.html("")
                energy_inputs.removeAttr("disabled", "disabled")
            }

            let racial_bonus = ""
            for (let i in this.formula_elements) {
                const base_array = this.formula_elements[i][0].id.split("-")
                const formula_base_name = base_array[base_array.length - 1]
                if (formula_base_name === "resistance" && is_hobbit()) {
                    racial_bonus = " (bonus racial déjà appliqué)" +
                        "</div><div class='row mx-1 align-middle'>Ce jet est raté s'il s'agit de résister à l'hypnose ou aux illusions"
                }
            }

            const details = $("#roll-dialog-details")
            const threshold_name = discovery ? "Valeur du test <=" : "Valeur seuil ="
            if (this.energy_investment_validated) {
                details.html("<div class='row mx-1 align-middle'>Somme des 2d6 = " + this.dice_value()
                    + this.dice_buttons("base_dices", this.base_dices)
                    + "</div><div class='row mx-1 align-middle'>" + threshold_name
                    + "&nbsp;<span id='roll-dialog-threshold'>"
                    + this.max_threshold() + "</span>" + racial_bonus + "</div>" + text_end + effect_text)
                $("#roll-dialog-result-label").removeClass("d-none")
            } else {
                details.html("<div class='row mx-1 align-middle'>" + threshold_name
                    + "&nbsp;<span id='roll-dialog-threshold'>"
                    + this.max_threshold() + "</span>" + racial_bonus + "</div>" + text_end + effect_text)
                $("#roll-dialog-result-label").addClass("d-none")
            }

            // Reset additional modifiers
            if (!ignore_sliders) {
                select_modifier.slider("setValue", this.margin_modifier)
                select_effect_modifier.slider("setValue", this.effect_modifier)
                select_modifier.slider("refresh", {useCurrentValue: true})
                select_effect_modifier.slider("refresh", {useCurrentValue: true})
            }
            if (this.energy_investment_validated) {
                $(".roll-dialog-slider").removeClass("d-none")
            } else {
                $(".roll-dialog-slider").addClass("d-none")
            }

            let effect = this.effect
            if (this.energy_investment_validated) {
                if (is_v7) {
                    // Show the actual effect instead of [A] or [B+2]
                    effect = effect.replaceAll(effect_column_regex, (match, prefix, column, modifier, suffix) => {
                        prefix = prefix.replace(" ", "&nbsp;")
                        modifier = typeof modifier === "undefined" ? 0 : parseInt(modifier)
                        const effect_value = this.is_success() ? this.column_effect(column, modifier) : 0
                        suffix = suffix.replace(" ", "&nbsp;")
                        return prefix + "<span class='roll-dialog-effect' column='" + column + "' " + "modifier='" + modifier + "'>" + effect_value + "</span>" + suffix
                    })
                } else {
                    // Update with the DSS if "DSS" is in the text
                    effect = effect.replaceAll(effect_dss_regex, (match, prefix, _, suffix) => {
                        return prefix.replace(" ", "&nbsp;") + "<span class='roll-dialog-dss'>" + this.dss() + "</span>"
                            + suffix.replace(" ", "&nbsp;")
                    })
                    effect = effect.replaceAll(effect_des_regex, (match, prefix, _, suffix) => {
                        return prefix.replace(" ", "&nbsp;") + "<span class='roll-dialog-des'>" + this.des() + "</span>"
                            + suffix.replace(" ", "&nbsp;")
                    })
                }
                effect = effect.replaceAll(effect_margin_regex, (match, prefix, _, suffix) => {
                    return prefix.replace(" ", "&nbsp;")
                        + "<span class='roll-dialog-margin'>" + this.post_test_margin() + "</span>"
                        + suffix.replace(" ", "&nbsp;")
                });
            }
            effect = "<div class='row mx-1 align-middle'>Effet:</div><div class='row mx-1 align-middle'>" + effect + "</div>"

            if (this.is_magic && this.distance.length > 0) {
                const distance = this.distance.replaceAll(/\d+/gi, (match) => {
                    return String(parseInt(match) * Math.pow(2, this.magic_power))
                })
                effect = "<div class='row mx-1 align-middle'>Portée: " + distance + "</div>" + effect
            }
            if (this.is_magic && this.duration.length > 0) {
                const duration = this.duration.replace(/\d+/gi, (match) => {
                    return String(parseInt(match) / Math.pow(2, this.optional_speed))
                })
                effect = "<div class='row mx-1 align-middle'>Durée d'incantation: " + duration + "</div>" + effect
            }

            // Update with the MR if "MR" is in the text
            $("#roll-dialog-effect").html(effect)

        } else {
            roll_effect_divs.addClass("d-none")
            roll_magic_divs.addClass("d-none")
            $("#roll-dialog-result-label").html("Résultat du jet de 2d6 = ")
            $("#roll-dialog-result").html(this.dice_value())
            $("#roll-dialog-details").html(this.dice_buttons("base_dices", this.base_dices)).removeClass("d-none")
        }

        let title = "<h2>" + ((this.reason.length > 0) ? this.reason : "Résultat du jet")
            + "</h2>"
        if (this.formula_elements.length > 0) {
            title += "<h4>"
            for (let i = 0; i < this.formula_elements.length; i++) {
                const symbol = $("label[for='" + this.formula_elements[i][0].id + "'] svg").get(0)
                title += symbol.outerHTML
                if (i !== this.formula_elements.length - 1)
                    title += "&nbsp;+&nbsp;"
            }
            title += "</h4>"
        }
        $("#roll-dialog-title").html(title
            + "<sm class='text-center'>" + this.timestamp.toLocaleString("fr-FR") + "</sm>")

        // Make dices clickable to reroll
        $(".roll-link").on("click", e => {
            let target = $(e.target)
            if (!target.hasClass("roll-link"))
                target = target.parents(".roll-link")

            const new_value = roll_dices(1, 6)
            const dice_group = target.get(0).getAttribute("data-dice-group")
            const dice_idx = target.get(0).getAttribute("data-dice-idx")
            current_roll[dice_group][dice_idx] = new_value
            target.tooltip("dispose")
            current_roll.show_roll()
        }).tooltip({disabled: false})

        $(".roll-dialog-energy").parent().tooltip({disabled: false})
    }

    trigger_roll() {
        this.show_roll()
    }
}

function slider_value_changed(input) {
    return modifier => {
        /* When it is called on creation, current_roll is null */
        if (!current_roll)
            return modifier

        if (input.id === "roll-dialog-modifier") { // Modify the MR only for MR modifier
            current_roll.margin_modifier = modifier
            current_roll.show_roll(true)
        } else {
            current_roll.effect_modifier = modifier
        }

        // Update with scaled effect in the text
        $(".roll-dialog-effect").each((i, elem) => {
            const column = elem.getAttribute("column")
            let column_modifier = elem.getAttribute("modifier")
            column_modifier = column_modifier.length > 0 ? parseInt(column_modifier) : 0
            const effect_value = current_roll.column_effect(column, column_modifier)
            $(elem).html(effect_value)
        })
        return modifier
    }
}

$(_ => {
    activate_slider($("#roll-dialog-modifier")[0], slider_value_changed, _ => void 0,
        {tooltip: "always"})
    const effect_modifier = $("#roll-dialog-effect-modifier")
    if (effect_modifier.length > 0)
        activate_slider(effect_modifier[0], slider_value_changed, _ => void 0,
            {tooltip: "always"})
})

/* Quick roll button */

$("#roll-2d6").on("click", _ => {
    // Reset invested energies
    $(".roll-dialog-energy").val(0)
    // Trigger roll
    new Roll().trigger_roll()
    $('#roll-dialog').modal()
})

/* Energies */

function get_energy_investment_inputs(energy_input) {
    const id = energy_input.id
    return $("#roll-dialog-" + id + ", #roll-dialog-optional-" + id + ", #roll-dialog-magic-" + id)
}

function update_max_invested_energies(energy_input) {
    let value = parseInt(energy_input.value)
    if (isNaN(value))
        value = 0
    const elems = get_energy_investment_inputs(energy_input)
    let remaining = value
    elems.each((i, invested) => {
        let current_value = parseInt(invested.value)
        if (isNaN(current_value))
            current_value = 0
        remaining -= current_value
    })
    elems.each((i, invested) => {
        let current_value = parseInt(invested.value)
        if (isNaN(current_value))
            current_value = 0
        // Update max investment value
        invested.setAttribute("max", current_value + remaining)
    })
}

$(".energy").on("change", event => {
    let value = parseInt(event.target.value)
    if (isNaN(value))
        value = 0
    get_energy_investment_inputs(event.target).each((i, invested) => {
        const title = $(".roll-dialog-energy-investment")
        if (value > 0) {
            $(invested).parent().removeClass("d-none")
            if (title.length > 0) {
                title.removeClass("d-none")
            }
        } else {
            $(invested).parent().addClass("d-none")
            if (title.length > 0) {
                const available_energies = $(".energy").filter((_, e) => {
                    return parseInt(e.value) > 0
                })
                if (available_energies.length === 0)
                    title.addClass("d-none")
            }
        }
    })
    update_max_invested_energies(event.target)
})

$(".roll-dialog-energy").on("change", e => {
    if (!current_roll)
        return
    // Trigger the same roll but with the correct precision
    current_roll.update_energies(true)
    $(e.target).parent().tooltip("dispose")
    current_roll.show_roll()
})

/* Navigates through history */

function current_roll_idx() {
    return last_rolls.findIndex(elem => {
        return elem === current_roll
    }, last_rolls)
}

$("#roll-dialog-history-backward").on("click", _ => {
    if (!current_roll)
        return
    const idx = current_roll_idx() - 1
    if (idx >= 0) {
        last_rolls[idx].show_roll()
    }
})

$("#roll-dialog-history-forward").on("click", _ => {
    if (!current_roll)
        return
    const idx = current_roll_idx() + 1
    if (idx < last_rolls.length) {
        last_rolls[idx].show_roll()
    }
})

$("#roll-dialog-validate").on("click", _ => {
    if (!current_roll)
        return
    current_roll.energy_investment_validated = true
    current_roll.show_roll()
})
