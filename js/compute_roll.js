/* Rolls and spells */

const talent_list_selector = ".talent input[id*='-name']"

/* Spell-related */

function add_row_listeners(line = $(document)) {
    add_save_to_dom_listeners(line)
    line.find(".spell-name").on("change", _ => {
        compute_remaining_ap()
    })
    line.find("select.spell-list").on("changed.bs.select", list_changed)
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
    line.find("select.spell-talent").each((i, elem) => {
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
    line.find("select.roll-talent,select.dual_wielding-talent,select.dual_wielding-tap-talent").each((i, elem) => {
        if (!elem.id.includes("-x-")) {
            $(elem).on("changed.bs.select", e => {
                roll_changed(e)
            })
        }
    })
}

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
            "</svg>&nbsp;" + instinctive_magic})
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
    $("select.spell-list").each((i, input) => {
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
    new_spell.find("#spell-" + new_id + "-list").selectpicker({sanitize: false})
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
