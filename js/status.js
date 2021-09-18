/* HP slider */

function hp_update(event) {
    const base_id = event.target.id.split("hp-")[0]
    const value = parseInt(event.target.value)
    const max_value = parseInt(event.target.getAttribute("data-slider-max"))
    const slider = $($(event.target).slider("getElement"))
    const handle = slider.find(".slider-handle.custom")
    const selection = slider.find(".slider-selection")
    // Update color
    if (value === 0) {
        handle.removeClass('full').removeClass('unease').addClass('dead')
        selection.removeClass('full').removeClass('unease')
    } else if (max_value - value >= 2) {
        handle.removeClass('full').addClass('unease').removeClass('dead')
        selection.removeClass('full').addClass('unease')
    } else {
        handle.addClass('full').removeClass('unease').removeClass('dead')
        selection.addClass('full').removeClass('unease')
    }
    // Recompute minimum unease
    let unease_sum = 0
    const old_unease = get_unease(base_id)
    const hp_sliders = $(".hp.input-slider")
    for (let i = 0; i < hp_sliders.length; i++) {
        const max_value = parseInt(hp_sliders[i].getAttribute("data-slider-max"))
        const current_value = parseInt(hp_sliders[i].value)
        if (max_value - current_value >= 2 || current_value === 0) // The second part is needed if the maximum HP is 1
            unease_sum += 1
    }
    set_slider_min($("#" + base_id + "unease"), unease_sum)
    if (get_unease(base_id) !== old_unease)
        unease_value_changed_event()
}

/* Update armor penalty */

function armor_penalty(armor_sum) {
    let penalty = 0
    if (armor_sum >= 12 && armor_sum <= 23) {
        penalty = -1
    } else if (armor_sum >= 24 && armor_sum <= 30) {
        penalty = -2
    } else if (armor_sum >= 31) {
        penalty = "-3 (actions physiques) et -1 (autres actions)"
    }
    return penalty
}

function get_armor_penalty() {
    // If no localized HP, this is a user encoded value
    if (!localized_hp) {
        const penalty = $("#armor-penalty-input").val()
        return penalty != null ? penalty : 0
    }

    const armors = $.map($(".armor"), element => (parseInt(element.value) || 0))
    let armor_sum = 0
    for (let i = 0; i < armors.length; i++) {
        armor_sum += armors[i]
    }

    // Take shield into account
    const shield = parseInt($("#shield").val()) || 0
    if (!isNaN(shield) && shield > 0) {
        // Check if shield talent exists and is above 0
        const shield_talent = talent_from_name('Bouclier')
        const level = shield_talent.length > 0 ? parseInt(talent_level(shield_talent)[0]) : NaN
        if (!isNaN(level) && level >= 0) {
            return armor_penalty(armor_sum) + " en parade, "
                + armor_penalty(armor_sum + shield * 6) + " en protection"
        }
        return armor_penalty(armor_sum) + " en parade (protection impossible car le talent 'Bouclier' est à moins de 0)"
    }

    return armor_penalty(armor_sum)
}

function recompute_armor_penalty() {
    $("#armor-penalty").text(get_armor_penalty())
}

$(".armor").on("change", _ => {
    recompute_armor_penalty()
})

$("#shield").on("change", _ => {
    recompute_armor_penalty()
})

/* Update constitution on resistance change */
const light_bonus_class = "light-bonus-applied"
const heavy_bonus_class = "heavy-bonus-applied"
$("#resistance").on("change", event => {
    if (discovery)
        return
    const target = $(event.target)
    const value = parseInt(event.target.value) || 0
    const trunk = $("#hp-trunk")
    const right_leg = $("#hp-right-leg")
    const left_leg = $("#hp-left-leg")
    const unease = $("#unease")
    const current_trunk_max = slider_max(trunk[0])
    const current_right_leg_max = right_leg.length > 0 ? slider_max(right_leg[0]) : 0
    const current_left_leg_max = left_leg.length > 0 ? slider_max(left_leg[0]) : 0
    if (value <= 1) { // Weak constitution
        if (target.hasClass(light_bonus_class)) { // from normal to weak
            target.removeClass(light_bonus_class)
            set_slider_max(trunk, current_trunk_max - 1)
        } else if (target.hasClass(heavy_bonus_class)) { // from heavy to weak
            target.removeClass(heavy_bonus_class)
            set_slider_max(trunk, current_trunk_max - 2)
            set_slider_max(right_leg, current_right_leg_max - 1)
            set_slider_max(left_leg, current_left_leg_max - 1)
        }
        set_slider_max(unease, 4)
    } else if (value === 2) { // Normal constitution
        if (target.hasClass(heavy_bonus_class)) { // from strong to normal
            target.removeClass(heavy_bonus_class)
            set_slider_max(trunk, current_trunk_max - 1)
            set_slider_max(right_leg, current_right_leg_max - 1)
            set_slider_max(left_leg, current_left_leg_max - 1)
        } else if (!target.hasClass(light_bonus_class)) { // from weak to normal
            set_slider_max(trunk, current_trunk_max + 1)
        }
        target.addClass(light_bonus_class)
        set_slider_max(unease, 5)
    } else { // Strong constitution
        if (target.hasClass(light_bonus_class)) { // from normal to strong
            target.removeClass(light_bonus_class)
            set_slider_max(trunk, current_trunk_max + 1)
            set_slider_max(right_leg, current_right_leg_max + 1)
            set_slider_max(left_leg, current_left_leg_max + 1)
        } else if (!target.hasClass(heavy_bonus_class)) { // from weak to strong
            set_slider_max(trunk, current_trunk_max + 2)
            set_slider_max(right_leg, current_right_leg_max + 1)
            set_slider_max(left_leg, current_left_leg_max + 1)
        }
        target.addClass(heavy_bonus_class)
        set_slider_max(unease, 6)
    }
})

/* Update PS and EP max values depending on respectively heart and mind values */

function update_body_energy(component, body_energy) {
    const value = parseInt(component.value) || 0
    const current_max = slider_max(body_energy[0])
    if (value >= 5 && !$(component).hasClass("bonus-applied")) { // Higher value to update
        set_slider_max(body_energy, current_max + 1)
        $(component).addClass("bonus-applied")
    } else if (value < 5 && $(component).hasClass("bonus-applied")) { // Lower value to update
        set_slider_max(body_energy, current_max - 1)
        $(component).removeClass("bonus-applied")
    }
}

$("#mind").on("change", event => {
    if (discovery)
        return
    update_body_energy(event.target, $("#psychic"))
})
$("#heart").on("change", event => {
    if (discovery)
        return
    update_body_energy(event.target, $("#breath"))
})
$("#instincts").on("change", event => {
    if (discovery)
        return
    update_body_energy(event.target, $("#breath"))
})

/* Update unease, PV, PS and EP if users click on the button */

function increment_unease(event) {
    const base_id = event.target.id.split("increment")[0]
    const unease = $("#" + base_id + "unease")
    const current_max = slider_max(unease[0])
    set_slider_max(unease, current_max + 1)

    // Adventure points
    compute_remaining_ap()
}

$("#increment-unease").on("click", increment_unease)

function decrement_unease(event) {
    const base_id = event.target.id.split("decrement")[0]
    const unease = $("#" + base_id + "unease")
    const current_max = slider_max(unease[0])
    if (current_max > 1)
        set_slider_max(unease, current_max - 1)

    // Adventure points
    compute_remaining_ap()
}

$("#decrement-unease").on("click", decrement_unease)

function increment_breath(event) {
    const base_id = event.target.id.split("increment")[0]
    const breath = $("#" + base_id + "breath")
    const current_max = slider_max(breath[0])
    if (current_max < 8 && is_v7 || current_max < 7 && !is_v7 || npc_grid)
        set_slider_max(breath, current_max + 1)

    // Adventure points
    compute_remaining_ap()
}

$("#increment-breath").on("click", increment_breath)

function decrement_breath(event) {
    const base_id = event.target.id.split("decrement")[0]
    const breath = $("#" + base_id + "breath")
    const current_max = slider_max(breath[0])
    if (current_max > 1)
        set_slider_max(breath, current_max - 1)

    // Adventure points
    compute_remaining_ap()
}

$("#decrement-breath").on("click", decrement_breath)
$("#lost-breath").on("change", _ => {
    compute_remaining_ap()
})

function increment_psychic(event) {
    const base_id = event.target.id.split("increment")[0]
    const psychic = $("#" + base_id + "psychic")
    const current_max = slider_max(psychic[0])
    if (current_max < 8 && is_v7 || current_max < 7 && !is_v7 || npc_grid)
        set_slider_max(psychic, current_max + 1)

    // Adventure points
    compute_remaining_ap()
}

$("#increment-psychic").on("click", increment_psychic)

function decrement_psychic(event) {
    const base_id = event.target.id.split("decrement")[0]
    const psychic = $("#" + base_id + "psychic")
    const current_max = slider_max(psychic[0])
    if (current_max > 1)
        set_slider_max(psychic, current_max - 1)

    // Adventure points
    compute_remaining_ap()
}

$("#decrement-psychic").on("click", decrement_psychic)
$("#lost-psychic").on("change", _ => {
    compute_remaining_ap()
})

function increment_hp(e) {
    const split = e.target.id.split("increment-")
    const base_id = split[0]
    const hp_id = split[1]
    const hp = $("#" + base_id + hp_id)
    const current_max = slider_max(hp[0])
    if (current_max < 8 && is_v7 || current_max < 7 && !is_v7 || npc_grid) {
        set_slider_max(hp, current_max + 1)
        hp_update({target: hp[0]})
    }

    // Adventure points
    compute_remaining_ap()
}

$("[id^=increment-hp]").on("click", increment_hp)

function decrement_hp(e) {
    const split = e.target.id.split("decrement-")
    const base_id = split[0]
    const hp_id = split[1]
    const hp = $("#" + base_id + hp_id)
    const current_max = slider_max(hp[0])
    if (current_max > 1) {
        set_slider_max(hp, current_max - 1)
        hp_update({target: hp[0]})
    }

    // Adventure points
    compute_remaining_ap()
}

$("[id^=decrement-hp]").on("click", decrement_hp)

/* Update the tooltip */
function details_hp(e) {
    const split = e.target.id.split("details-")
    const base_id = split[0]
    const hp_id = split[1]
    const hp = localized_hp ? $("[data-target=\"#" + base_id + hp_id + "-max-update\"") : $("#" + base_id + "hp-title")
    const note = $(e.target).val()
    let text = ""
    const base = hp[0].getAttribute("data-original-title-base")
    if (!note || note.length === 0) {
        text = base
    } else {
        text = note
            + (base && base.length > 0 && !is_v7 ? "<br/>" + hp[0].getAttribute("data-original-title-base") : "")
    }
    hp[0].setAttribute("data-original-title", text)
    hp.tooltip("dispose")
    hp.tooltip()
}

$("[id^=details-hp]").on("change", details_hp)

/* Show/hide absorption on click */
$("#toggle-absorption").on("click", e => {
    const show = $(e.target).text().includes("Voir")
    $(".absorption").each((i, elem) => {
        if (show) {
            $(elem).parent().removeClass("d-none")
        } else {
            $(elem).parent().addClass("d-none")
        }
    })
    if (show) {
        $(e.target).text("Cacher l'absorption des dégâts")
    } else {
        $(e.target).text("Voir l'absorption des dégâts")
    }
})

/* Enable all the sliders on load */

function get_unease(base_id = "") {
    const unease = parseInt($("#" + base_id + "unease-value").text())
    return isNaN(unease) ? 0 : unease
}

function unease_value_changed_event() {
    $(".row-roll-trigger").each((i, elem) => {
        row_of(elem).update_roll_value(elem)
    })
}

function init_status(base_id = "") {
    const temporary_breath_div = $("#" + base_id + "temporary-breath")
    let current_temporary_breath = parseInt(temporary_breath_div.val())
    if (isNaN(current_temporary_breath))
        current_temporary_breath = 0

    temporary_breath_div.on("change", _ => {
        const breath = $("#" + base_id + "breath")
        const current_max = slider_max(breath[0])

        let new_value = parseInt(temporary_breath_div.val())
        if (isNaN(new_value))
            new_value = 0

        set_slider_max(breath, current_max - current_temporary_breath + new_value)
        current_temporary_breath = new_value
    })

    /**
     * Warning: Do not exchange unease and hp slider initializations
     * The initializations of the HP sliders need to set the unease slider if
     * player health is too low
     */

    if (localized_hp) {
        activate_slider($('#' + base_id + 'unease')[0], input => {
            return value => {
                const max = slider_max(input)
                const initial_malus = -1 + max - 4
                let text
                let unease = 0
                if (value === 0 || initial_malus - value >= 0) {
                    text = "\u2205"
                } else if (value === max) {
                    text = "coma"
                    unease = initial_malus - value
                } else {
                    text = "malus de " + (initial_malus - value)
                    unease = initial_malus - value
                }
                $("#" + base_id + "unease-text").text(text)
                $("#" + base_id + "unease-value").text(unease)
                return text
            }
        }, _ => void 0, {}, unease_value_changed_event)

        $(".hp-link").on("click", e => {
            let dialog_id = e.target.getAttribute("data-target")
            if (dialog_id == null) {
                const parent = $(e.target).parents(".hp-link")
                if (parent.length > 0)
                    dialog_id = $(e.target).parents(".hp-link")[0].getAttribute("data-target")
            }
            if (dialog_id == null)
                return
            // Start dialog to update the HP of the zone
            $(dialog_id).modal()
        })
    }

    $("#" + base_id + "hp-head,#" + base_id + "hp-trunk,#" + base_id + "hp-right-arm,#" + base_id + "hp-left-arm,#" + base_id + "hp-right-leg,#" + base_id + "hp-left-leg").each((i, input) => {
        activate_slider(input, build_max_formatter, slider => {
            $(slider.slider("getElement")).addClass("hp-slider")
            hp_update({target: slider[0]})
        }, {}, hp_update)
    })

    activate_slider($('#' + base_id + 'breath')[0], (input) => {
        return (value) => {
            if (value === 0)
                return "K.O."
            return value + "/" + slider_max(input)
        }
    })

    activate_slider($('#' + base_id + 'psychic')[0], (input) => {
        return (value) => {
            if (value === 0)
                return "Fou"
            return value + "/" + slider_max(input)
        }
    })

    activate_slider($('#' + base_id + 'rest')[0])
}

$(_ => {
    init_status()
})
