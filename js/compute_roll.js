/* Rolls and spells */

const talent_list_selector = ".talent input[id*='-name']"

/* Spell-related */

function add_row_listeners(row = $(document)) {
    add_save_to_dom_listeners(row)
    row.find(".spell-name").on("change", _ => {
        compute_remaining_ap()
    })
    row.find(".spell-list").on("change", list_changed)
    row.find(".spell-formula-elem").on("click", event => {
        update_spell_value(row_elem(event.target, "value"))
    })
    row.find(".spell-difficulty-input").on("change", event => {
        update_spell_value(row_elem(event.target, "value"))
    })
    row.find(".row-roll-trigger").on("click", event => {
        // Find the real target of the click
        let button = $(event.target)
        if (!button.hasClass("row-roll-trigger"))
            button = $(event.target).parents(".row-roll-trigger")

        // Find either spell difficulty or talent level to detect critical rolls
        let difficulty
        const spell_difficulty = row_elem(button[0], "difficulty")
        if (spell_difficulty.length > 0) { // Spell
            difficulty = parseInt(spell_difficulty.text())
        } else { // Talent
            const talent_select = row_elem(button[0], "talent")
            const talent = talent_select.find("option:selected").val()
            difficulty = parseInt(talent_level($(".talent input[value='" + talent + "']")))
        }
        difficulty = isNaN(difficulty) ? 0 : difficulty

        // Do the actual roll
        const value = parseInt(row_elem(button[0], "value").text()) // Recover max value
        trigger_roll(value, difficulty, row_elem(button[0], "effect").val())
    })
    row.find(".roll-formula-elem").on("click", roll_changed)
}

function compute_formula(row) {
    const elements = ["component", "means", "realm"]
    let sum = 0
    for (let i = 0; i < elements.length; i++) {
        const elem_name = row[0].id + "-" + elements[i]
        const checked_elem = $("input[name=" + elem_name + "]:checked")
        if (checked_elem.length === 0)
            return null  // Not a full formula
        const base_array = checked_elem[0].id.split("-")
        sum += parseInt($("#" + base_array[base_array.length - 1]).val())
    }
    return sum
}

function update_spell_value(value_div) {
    let sum = 0

    // Recover component, means and realm
    const formula = compute_formula(row(value_div[0]))
    sum += formula

    // Recover difficulty
    sum += parseInt(row_elem(value_div[0], "difficulty").text())

    // Update
    value_div.text(sum)
    row_elem(value_div[0], "dice")[0].removeAttribute("hidden")
}

function list_changed(event) {
    // Fix the level to 0 if divine or ki energies
    const slider = row_elem(event.target, "difficulty-input")
    if (slider.length === 0 || slider[0].id.includes("spell-x-"))
        return

    if (event.target.value === "Divin") {
        slider.val(10).slider("setValue", 10).slider("refresh", {useCurrentValue: true}).slider("disable")
        $(slider.slider("getElement")).hide()
    } else if (event.target.value.length === 0) {
        slider.slider("enable").slider("refresh", {useCurrentValue: true})
        $(slider.slider("getElement")).show()
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
    const formula = compute_formula(row(value_div[0]))
    sum += formula

    // Add talent if any
    let talent = row_elem(value_div[0], "talent")
    if (talent.length === 0)
        return
    talent = talent.val()

    const talent_div = $(".talent input[value='" + talent + "']")
    if (talent_div.length === 0)
        sum = "X"
    else {
        const level = talent_level(talent_div[0])
        if (level === "x")
            sum = "X"
        else
            sum += parseInt(level)
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

$(".realm,.component,.realm," + talent_list_selector).on("change", _ => {
    // Update all of the spell values
    $(".spell-value").each((i, elem) => {
        update_spell_value($(elem))
    })
    // Update all the rolls
    $(".roll-value").each((i, elem) => {
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
    select.on("changed.bs.select", (e, clickedIndex, newValue, oldValue) => {
        roll_changed(e)
    })
    add_row_listeners()
})

/* Actual roll */

function roll_dices(number = 2, type = 6) {
    let sum = 0
    for (let i = 0; i < number; i++) {
        let random = Math.random()
        sum += Math.floor(random * type) + 1
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

function compute_effect(dices, column, modifier) {
    const total = parseInt(dices) + (modifier.length > 0 ? parseInt(modifier) : 0)
    if (total < 0)
        return 0
    if (total > 26) {
        const additional_ranges = Math.floor((total - 26) / 4) + 1
        return effect_table[column][26] + effect_upgrade[column] * additional_ranges
    }
    return effect_table[column][total]
}

const effect_column_regex = /(\W)?\[([ABCDEFGHIJK])([+-]\d+)?]/gi
const effect_margin_regex = /(^|\W)(MR)(\W|$)/gi

function trigger_roll(max_value = null, talent_level = 0, effect="") {
    // Reset text
    $("#roll-dialog-1d6-result").text("")
    $("#roll-dialog-2d6-result").text("")
    const critical_div = $("#roll-dialog-critical")
    critical_div.text("")

    const dice_value = roll_dices()

    // Check for critical rolls
    let text_end = ""
    let modifier = 0
    if (dice_value === 12) {
        critical_div.html("<b class='text-danger'>Échec critique... :'(</b>")
        modifier = -1 * roll_dices(1)
        text_end = "<br/>1d6 retiré à la marge d'une valeur de " + modifier
    } else if (dice_value <= 2 + talent_level) {
        critical_div.html("<b class='text-success'>Succès critique !</b>")
        modifier = roll_dices(1 + talent_level)
        text_end = "<br/>" + (1 + talent_level) + "d6 ajouté" + ((talent_level > 0) ? "s" : "")
            + " à la marge d'une valeur de " + modifier
    }

    // Fill in penalties
    let penalty_text = ""
    const unease = get_unease()
    if (unease !== 0) {
        penalty_text += "\nMalaise courant: " + unease + " (déjà appliqué)\n"
    }
    const armor_penalty = get_armor_penalty()
    if (armor_penalty !== 0) {
        penalty_text += "\nMalaise d'armure: " + armor_penalty + " (cela s'applique sur les actions physiques)\n"
    }
    $("#roll-dialog-penalties").text(penalty_text)

    const select_modifier = $("#roll-dialog-modifier")
    if (max_value) {
        $("#roll-dialog-result-label").html("Marge = ")
        const result = $("#roll-dialog-result")
        const margin = max_value + unease - dice_value + modifier
        result[0].setAttribute("value", margin.toString())
        result.html(margin)

        const effect_dices = roll_dices(2)
        $("#roll-dialog-details").html("Somme des 2d6 = " + dice_value + "<br/>Valeur seuil = " + (max_value + unease)
            + "" + text_end + "<br/>Dés d'effet = " + effect_dices)

        // Reset additional modifier
        select_modifier.slider("setValue", 0)
        select_modifier.slider("refresh", {useCurrentValue: true})
        $(select_modifier.slider("getElement")).show()

        const effect_divs = $(".roll-dialog-effect-hide")
        if (margin <= 0) {
            effect_divs.addClass("d-none")
        } else {
            effect_divs.removeClass("d-none")
        }

        // Show the actual effect instead of [A] or [B+2]
        effect = effect.replaceAll(effect_column_regex, (match, p1, p2, p3) => {
            p1 = typeof p1 === "undefined" ? "" : "&nbsp;"
            p3 = typeof p3 === "undefined" ? "" : p3
            return p1 + "<span class='roll-dialog-effect' value='" + effect_dices + "' column='" + p2 + "' " +
                "modifier='" + p3 + "'>" + compute_effect(effect_dices + margin, p2, p3) + "</span>"
        })
        // Update with the MR if "MR" is in the text
        $("#roll-dialog-effect").html(effect.replaceAll(effect_margin_regex,
            "$1<span class='roll-dialog-margin'>" + margin + "</span>$3"))

    } else {
        $("#roll-dialog-result-label").html("Résultat du jet de 2d6 = ")
        $("#roll-dialog-result").html(dice_value)
        $("#roll-dialog-details").html("")
        $(select_modifier.slider("getElement")).hide()
        $(".roll-dialog-effect-hide").addClass("d-none")
    }

    $('#roll-dialog').modal()
}

$(_ => {
    activate_slider($("#roll-dialog-modifier")[0], _ => {
        return modifier => {
            const result_span = $("#roll-dialog-result")
            const result = parseInt(result_span[0].getAttribute("value"))
            const margin = result + modifier
            result_span.html(margin)

            const effect_divs = $(".roll-dialog-effect-hide")
            if (margin <= 0) {
                effect_divs.addClass("d-none")
            } else {
                effect_divs.removeClass("d-none")
            }

            // Replace MR in effect
            $(".roll-dialog-margin").html(margin)

            // Update with scaled effect in the text
            $(".roll-dialog-effect").each((i, elem) => {
                const effect_dices = parseInt(elem.getAttribute("value"))
                const column = elem.getAttribute("column")
                let column_modifier = elem.getAttribute("modifier")
                column_modifier = column_modifier.length > 0 ? parseInt(column_modifier) : 0
                $(elem).html(compute_effect(effect_dices + margin, column, column_modifier))
            })
            return modifier
        }
    }, _ => void 0, {tooltip: "always"})
})
