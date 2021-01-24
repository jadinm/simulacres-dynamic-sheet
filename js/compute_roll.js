/* Rolls and spells */

const talent_list_selector = ".talent input[id*='-name']"

/* Spell-related */

function add_row_listeners(line = $(document)) {
    add_save_to_dom_listeners(line)
    line.find(".spell-name").on("change", _ => {
        // Update selections of spells
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
        compute_remaining_ap()
    })
    line.find("select.spell-list").on("changed.bs.select", list_changed)
    line.find(".spell-formula-elem").on("change", event => {
        event.preventDefault()
        update_spell_value($(event.target))
        if (event.target.getAttribute("name").includes("-realm")) {
            const realm_split = event.target.id.split("-")
            const realm = realm_split[realm_split.length - 1]
            const spell_difficulty_inputs = row_elem(event.target, "difficulty-input-" + realm).parents(".spell-difficulty-row")
            const spell_value = row_elem(event.target, "value-" + realm).parents(".spell-value-row")
            const spell_difficulty = spell_difficulty_inputs.prev()
            const row_div = row(event.target)
            const inline_realms = row_div.find("input[name*=-realm]:checked").length
            if (event.target.checked) {
                spell_difficulty_inputs.removeClass("d-none")
                spell_difficulty.removeClass("d-none")
                spell_value.removeClass("d-none")
            } else {
                spell_difficulty_inputs.addClass("d-none")
                spell_difficulty.addClass("d-none")
                spell_value.addClass("d-none")
            }
            if (inline_realms > 1) {
                row_div.find(".spell-realm").removeClass("d-none")
            } else {
                row_div.find(".spell-realm").addClass("d-none")
            }

            // Update adventure points
            compute_remaining_ap()
        }
    })
    line.find(".spell-difficulty-input").on("change", event => {
        update_spell_value($(event.target))
        // Update selections of spells because they depend on the level
        $("select.spell-select").each((i, elem) => {
            update_spell_select(elem)
        })
    })
    line.find(".hermetic-difficulty").on("change", event => {
        update_spell_value($(event.target))
    })
    line.find(".hermetic-mr-learning").on("change", event => {
        update_spell_value($(event.target))
    })
    line.find("select.spell-talent").each((i, elem) => {
        if (!elem.id.includes("-x-")) {
            $(elem).on("changed.bs.select", e => {
                update_spell_value($(e.target))
                compute_remaining_ap()
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
        const realm_split = button[0].id.split("-")
        const realm = realm_split[realm_split.length - 1]
        const spell_difficulty = row_elem(button[0], "difficulty-" + realm)
        const is_magic = spell_difficulty.length > 0
        const formula_elements = is_magic ? compute_formula(row(button[0]), realm)[1] : compute_formula(row(button[0]))[1]
        let margin_throttle = NaN
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
        const value = parseInt(row_elem(button[0], is_magic ? "value-" + realm : "value").text())
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

function compute_formula(row, fixed_realm = null) {
    const elements = ["component", "means", "realm"]
    let sum = 0
    const checked_elements = []
    for (let i = 0; i < elements.length; i++) {
        const elem_name = row[0].id + "-" + elements[i]
        let checked_elem = $("input[name=" + elem_name + "]:checked")
        if (elements[i] === "realm" && fixed_realm != null)
            checked_elem = checked_elem.filter("[id*=\"-" + fixed_realm + "\"]")
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

function update_spell_value(col_div) {
    const row_div = row(col_div[0])
    row_div.find(".spell-value").each((i, value_div) => {
        let sum = 0
        const realm_split = value_div.id.split("-")
        const realm = realm_split[realm_split.length - 1]

        // Recover component, means and realm
        const formula = compute_formula(row_div, realm)[0]
        sum += formula

        // Recover difficulty
        sum += parseInt(row_elem(col_div[0], "difficulty-" + realm).text())

        if (is_hermetic_spell(col_div[0])) {
            // Recover hermetic difficulty
            const cast_diff = parseInt(row_elem(col_div[0], "hermetic-difficulty-" + realm).val())
            if (!isNaN(cast_diff)) {
                sum += cast_diff
            }
            // Recover associated talent level
            const name = row_elem(col_div[0], "talent").val()
            if (name.length !== 0) {
                const talent = talent_from_name(name)
                // This is complicated because hermetic spells can have a penalty when they are not learned correctly
                // (MR < 0) and this penalty can be outside of the talent levels, like -6 or -3
                // However, once the talent is raised for the first time, this odd penalty disappears
                let level = parseInt(talent_level(talent[0]))
                let origin_level = parseInt(talent_base_level(talent[0]))
                let mr_learning = parseInt(row_elem(col_div[0], "hermetic-mr-learning-" + realm).val())

                // In this case a level "X" does not mean that they cannot cast the spell (though it will be difficult)
                if (isNaN(level))
                    level = -5
                if (isNaN(origin_level))
                    origin_level = -5
                if (isNaN(mr_learning))
                    mr_learning = 0

                if (level === origin_level && mr_learning < 0) {
                    // Did not pay the learning failure at least once
                    sum += mr_learning
                } else {
                    sum += level
                }
            }
        }

        // Update
        $(value_div).text(sum)
        row_elem(col_div[0], "dice-" + realm)[0].removeAttribute("hidden")
    })
}

function list_changed(event) {
    // Fix the level to 0 if divine energy
    const row_div = row(event.target)
    const slider = row_div.find(".spell-difficulty-input")
    if (slider.length === 0 || slider[0].id.includes("-x-"))
        return

    const radio_buttons = row_div.find(".spell-formula-elem")
    const difficulty = row_div.find(".spell-difficulty-value")
    const hermetic_difficulty = row_div.find(".hermetic-difficulty")
    const hermetic_mr_difficulty = row_div.find(".hermetic-mr-learning")
    const hermetic_talent = row_elem(event.target, "talent")
    const name = row_elem(event.target, "name")
    const handle = row_elem(event.target, "name-handle")
    radio_buttons.prop("disabled", false).removeAttr("disabled")
    hermetic_difficulty.parent().addClass("d-none")
    hermetic_mr_difficulty.parent().addClass("d-none")
    hermetic_talent.parent().parent().addClass("d-none")
    name.removeClass("d-none")
    handle.removeClass("d-none")
    difficulty.parent().removeClass("d-none")
    if ($(event.target).val() && ([priest_energy, instinctive_magic].includes($(event.target).val().trim()))) {
        slider.each((i, elem) => {
            $(elem).val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
            $($(elem).slider("getElement")).parent().addClass("d-none")
        })
    } else if ($(event.target).val() && $(event.target).val().trim() === hermetic_energy) {
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
        const hermetic_test = $([row_elem(event.target, "mind")[0],
            row_elem(event.target, "action")[0], row_elem(event.target, "humanoid")[0]])
        hermetic_test.each((i, elem) => {
            $(elem).trigger("click").trigger("change")
        })
        radio_buttons.prop("disabled", true)[0].setAttribute("disabled", "")
    } else {
        slider.each((i, elem) => {
            $(elem).slider("enable").slider("refresh", {useCurrentValue: true})
            $($(elem).slider("getElement")).parent().removeClass("d-none")
        })
    }

    // Update spell value
    update_spell_value(slider)

    // Update spell selects if they don't show a given energy
    $("select.spell-select").each((i, elem) => {
        update_spell_select(elem)
    })

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
    if (talent.length !== 0 && talent_div.length !== 0) {
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
        const realm_split = input.id.split("-")
        const difficulty_elem = row_elem(input,
            "difficulty-" + realm_split[realm_split.length - 1])
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
    new_spell.find("[id*=\"spell-" + new_id + "-difficulty-input\"").each((i, elem) => {
        activate_slider(elem, show_difficulty_builder)
    })

    new_spell.find("#spell-" + new_id + "-talent").selectpicker()
    new_spell.find("#spell-" + new_id + "-list").selectpicker({sanitize: false})
    add_row_listeners(new_spell)
    update_spell_value(new_spell)
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
