/* HP slider */

function hp_update(event) {
    const value = parseInt(event.target.value)
    const slider = $($(event.target).slider("getElement"))
    const handle = slider.find(".slider-handle.custom")
    const selection = slider.find(".slider-selection")
    // Update color
    if (value === 0) {
        handle.removeClass('full').removeClass('unease').addClass('dead')
        selection.removeClass('full').removeClass('unease')
    } else if (value <= 1) {
        handle.removeClass('full').addClass('unease').removeClass('dead')
        selection.removeClass('full').addClass('unease')
    } else {
        handle.addClass('full').removeClass('unease').removeClass('dead')
        selection.addClass('full').removeClass('unease')
    }
    // Recompute minimum unease
    let unease_sum = 0
    const hp_sliders = $(".hp.input-slider")
    for (let i = 0; i < hp_sliders.length; i++)
        if (hp_sliders[i].value <= 1)
            unease_sum += 1
    set_slider_min($("#unease"), unease_sum)
}

/* Update armor penalty */

function get_armor_penalty() {
    const armors = $.map($(".armor"), element => parseInt(element.value))
    let armor_sum = 0
    for (let i = 0; i < armors.length; i++) {
        armor_sum += armors[i] << 0
    }

    let penalty = 0
    if (armor_sum >= 12 && armor_sum <= 23) {
        penalty = -1
    } else if (armor_sum >= 24 && armor_sum <= 30) {
        penalty = -2
    } else if (armor_sum >= 31) {
        penalty = -3
    }
    return penalty
}

$(".armor").on("change", _ => {
    $("#armor-penalty").text(get_armor_penalty())
})

/* Update constitution on resistance change */

$("#resistance").on("change", event => {
    const value = parseInt(event.target.value)
    const trunk = $("#hp-trunk")
    const right_leg = $("#hp-right-leg")
    const left_leg = $("#hp-left-leg")
    const unease = $("#unease")
    if (value <= 1) { // Weak constitution
        set_slider_max(trunk, 3)
        set_slider_max(right_leg, 3)
        set_slider_max(left_leg, 3)
        set_slider_max(unease, 4)
    } else if (value === 2) { // Normal constitution
        set_slider_max(trunk, 4)
        set_slider_max(right_leg, 3)
        set_slider_max(left_leg, 3)
        set_slider_max(unease, 5)
    } else { // Strong constitution
        set_slider_max(trunk, 5)
        set_slider_max(right_leg, 4)
        set_slider_max(left_leg, 4)
        set_slider_max(unease, 6)
    }
})

/* Update PS and EP max values depending on respectively heart and mind values */

function update_body_energy(component, body_energy) {
    const value = parseInt(component.value)
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
    update_body_energy(event.target, $("#psychic"))
})
$("#heart").on("change", event => {
    update_body_energy(event.target, $("#breath"))
})

/* Update PS and EP if users click on the button */
$("#increment-breath").on("click", _ => {
    const breath = $("#breath")
    const current_max = slider_max(breath[0])
    if (current_max < 8)
        set_slider_max(breath, current_max + 1)

    // Adventure points
    compute_remaining_ap()
})
$("#decrement-breath").on("click", _ => {
    const breath = $("#breath")
    const current_max = slider_max(breath[0])
    if (current_max > 1)
        set_slider_max(breath, current_max - 1)

    // Adventure points
    compute_remaining_ap()
})
$("#increment-psychic").on("click", _ => {
    const psychic = $("#psychic")
    const current_max = slider_max(psychic[0])
    if (current_max < 8)
        set_slider_max(psychic, current_max + 1)

    // Adventure points
    compute_remaining_ap()
})
$("#decrement-psychic").on("click", _ => {
    const psychic = $("#psychic")
    const current_max = slider_max(psychic[0])
    if (current_max > 1)
        set_slider_max(psychic, current_max - 1)

    // Adventure points
    compute_remaining_ap()
})

/* Enable all the sliders on load */

function get_unease() {
    return parseInt($("#unease-value").text())
}

$(_ => {

    /**
     * Warning: Do not exchange unease and hp slider initializations
     * The initializations of the HP sliders need to set the unease slider if
     * player health is too low
     */

    activate_slider($('#unease')[0], input => {
        return value => {
            const max = slider_max(input)
            const initial_malus = -1 + max - 4
            let text = ""
            let unease = 0
            if (value === 0 || initial_malus - value === 0) {
                text = "\u2205"
            } else if (value === max) {
                text = "coma"
                unease = initial_malus - value
            } else {
                text = "malus de " + (initial_malus - value)
                unease = initial_malus - value
            }
            $("#unease-text").text(text)
            $("#unease-value").text(unease)
            return text
        }
    })

    $('.hp.input-slider').each((i, input) => {
        activate_slider(input, build_max_formatter, slider => {
            slider.on("change", hp_update)
            $(slider.slider("getElement")).addClass("hp-slider")
            hp_update({target: slider[0]})
        })
    })

    activate_slider($('#breath')[0], (input) => {
        return (value) => {
            if (value === 0)
                return "K.O."
            return value + "/" + slider_max(input)
        }
    })

    activate_slider($('#psychic')[0], (input) => {
        return (value) => {
            if (value === 0)
                return "Fou"
            return value + "/" + slider_max(input)
        }
    })

    activate_slider($('#rest')[0])
})
