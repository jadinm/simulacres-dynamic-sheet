class Status extends Model {
    static requirements = ["characteristics"]

    static members = []
    static hp_sliders = []
    static classic_sliders = localized_hp ? ["breath", "psychic", "unease", "rest"] : ["breath", "psychic", "rest"]
    static sliders = [...this.classic_sliders, ...this.hp_sliders]
    static save_slider_min_max = this.sliders

    static absorptions = []
    static armors = []
    static details = ["details-breath", "details-psychic", "details-unease"]

    static independent_checkboxes = is_v7 ? ["survival-available"] : []
    static selects = intermediate_discovery ? [] : ["shield"]

    hp_update(event) {
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
        const old_unease = this.get_unease()
        const hp_sliders = this.find(".hp.input-slider")
        for (let i = 0; i < hp_sliders.length; i++) {
            const max_value = parseInt(hp_sliders[i].getAttribute("data-slider-max"))
            const current_value = parseInt(hp_sliders[i].value)
            if (max_value - current_value >= 2 || current_value === 0) // The second part is needed if the maximum HP is 1
                unease_sum += 1
        }
        this.set_slider_min(this.get("unease"), unease_sum)
        if (this.get_unease() !== old_unease)
            this.unease_value_changed_event()
    }

    /**
     * @param armor_sum The sum of armors
     * @returns {number[]} the penalty for physical actions and the one for intellectual ones
     */
    armor_penalty(armor_sum) {
        let penalty = [0, 0]
        if (armor_sum >= 12 && armor_sum <= 23) {
            penalty = [-1, 0]
        } else if (armor_sum >= 24 && armor_sum <= 30) {
            penalty = [-2, 0]
        } else if (armor_sum >= 31) {
            penalty = [-3, -1] // "-3 (actions physiques) et -1 (autres actions)"
        }
        return penalty
    }

    get_armor_penalty() {
        // If no localized HP, this is a user encoded value
        if (!localized_hp) {
            const penalty = this.get("armor-penalty-input").val()
            return penalty != null ? [penalty, 0] : [0, 0]
        }

        const armors = $.map(this.find(".armor"), element => (parseInt(element.value) || 0))
        let armor_sum = 0
        for (let i = 0; i < armors.length; i++) {
            armor_sum += armors[i]
        }

        // Take shield into account
        const shield = parseInt(this.get("shield").val()) || 0
        if (!isNaN(shield) && shield > 0) {
            return this.armor_penalty(armor_sum + shield * 6)
        }

        return this.armor_penalty(armor_sum)
    }

    get_armor_penalty_text() {
        const penalties = this.get_armor_penalty()
        return penalties[1] !== 0 ? penalties[0] + " (actions physiques) " + penalties[1] + " (autres actions)" : penalties[0]
    }

    recompute_armor_penalty() {
        this.get("armor-penalty").text(this.get_armor_penalty_text())
        sheet.get_physical_rolls().forEach((roll) => roll.update_roll_value())
    }

    get_unease() {
        const unease = parseInt(this.get("unease-value").text())
        return isNaN(unease) ? 0 : unease
    }

    /* Update constitution on resistance change */
    update_resistance(target, value) {
        const trunk_div = this.get("hp-trunk")
        const right_leg_div = this.get("hp-right-leg")
        const left_leg_div = this.get("hp-left-leg")
        const unease_div = this.get("unease")

        const current_trunk_max = this["hp-trunk.max"]
        const current_right_leg_max = localized_hp ? this["hp-right-leg.max"] : 0
        const current_left_leg_max = localized_hp ? this["hp-left-leg.max"] : 0
        if (value <= 1) { // Weak constitution
            if (target.hasClass(light_bonus_class)) { // from normal to weak
                sheet.characteristics.remove_saved_class_to(target, light_bonus_class)
                this.set_slider_max(trunk_div, current_trunk_max - 1)
            } else if (target.hasClass(heavy_bonus_class)) { // from heavy to weak
                sheet.characteristics.remove_saved_class_to(target, heavy_bonus_class)
                this.set_slider_max(trunk_div, current_trunk_max - 2)
                this.set_slider_max(right_leg_div, current_right_leg_max - 1)
                this.set_slider_max(left_leg_div, current_left_leg_max - 1)
            }
            this.set_slider_max(unease_div, 4)
        } else if (value === 2) { // Normal constitution
            if (target.hasClass(heavy_bonus_class)) { // from strong to normal
                sheet.characteristics.remove_saved_class_to(target, heavy_bonus_class)
                this.set_slider_max(trunk_div, current_trunk_max - 1)
                this.set_slider_max(right_leg_div, current_right_leg_max - 1)
                this.set_slider_max(left_leg_div, current_left_leg_max - 1)
            } else if (!target.hasClass(light_bonus_class)) { // from weak to normal
                this.set_slider_max(trunk_div, current_trunk_max + 1)
            }
            sheet.characteristics.add_saved_class_to(target, light_bonus_class)
            this.set_slider_max(unease_div, 5)
        } else { // Strong constitution
            if (target.hasClass(light_bonus_class)) { // from normal to strong
                sheet.characteristics.remove_saved_class_to(target, light_bonus_class)
                this.set_slider_max(trunk_div, current_trunk_max + 1)
                this.set_slider_max(right_leg_div, current_right_leg_max + 1)
                this.set_slider_max(left_leg_div, current_left_leg_max + 1)
            } else if (!target.hasClass(heavy_bonus_class)) { // from weak to strong
                this.set_slider_max(trunk_div, current_trunk_max + 2)
                this.set_slider_max(right_leg_div, current_right_leg_max + 1)
                this.set_slider_max(left_leg_div, current_left_leg_max + 1)
            }
            sheet.characteristics.add_saved_class_to(target, heavy_bonus_class)
            this.set_slider_max(unease_div, 6)
        }
    }

    update_body_energy(component, value, body_energy_id) {
        const body_energy = this.get(body_energy_id)
        const current_max = this[body_energy_id + ".max"]
        if (value >= 5 && !component.hasClass(bonus_applied)) { // Higher value to update
            this.set_slider_max(body_energy, current_max + 1)
            sheet.characteristics.add_saved_class_to(component, bonus_applied)
        } else if (value < 5 && component.hasClass(bonus_applied)) { // Lower value to update
            this.set_slider_max(body_energy, current_max - 1)
            sheet.characteristics.remove_saved_class_to(component, bonus_applied)
        }
    }

    increment_hp(e) {
        const hp_id = e.target.id.split("increment-")[1]
        const hp = this.get(hp_id)
        const current_max = this[hp[0].id + ".max"]
        if (current_max < 8 && is_v7 || current_max < 7 && !is_v7 || npc_grid) {
            this.set_slider_max(hp, current_max + 1)
            this.hp_update({target: hp[0]})
        }

        // Adventure points
        compute_remaining_ap()
    }

    decrement_hp(e) {
        const hp_id = e.target.id.split("decrement-")[1]
        const hp = this.get(hp_id)
        const current_max = this[hp[0].id + ".max"]
        if (current_max > 1) {
            this.set_slider_max(hp, current_max - 1)
            this.hp_update({target: hp[0]})
        }

        // Adventure points
        compute_remaining_ap()
    }

    /* Update unease, PV, PS and EP if users click on the button */

    increment_unease() {
        const unease = this.get("unease")
        const current_max = this["unease.max"]
        this.set_slider_max(unease, current_max + 1)
    }

    decrement_unease() {
        const unease = this.get("unease")
        const current_max = this["unease.max"]
        if (current_max > 1)
            this.set_slider_max(unease, current_max - 1)
    }

    increment_breath() {
        const breath = this.get("breath")
        const current_max = this["breath.max"]
        if (current_max < 8 && is_v7 || current_max < 7 && !is_v7 || npc_grid)
            this.set_slider_max(breath, current_max + 1)

        // Adventure points
        compute_remaining_ap()
    }

    decrement_breath() {
        const breath = this.get("breath")
        const current_max = this["breath.max"]
        if (current_max > 1)
            this.set_slider_max(breath, current_max - 1)

        // Adventure points
        compute_remaining_ap()
    }

    increment_psychic() {
        const psychic = this.get("psychic")
        const current_max = this["psychic.max"]
        if (current_max < 8 && is_v7 || current_max < 7 && !is_v7 || npc_grid)
            this.set_slider_max(psychic, current_max + 1)

        // Adventure points
        compute_remaining_ap()
    }

    decrement_psychic() {
        const psychic = this.get("psychic")
        const current_max = this["psychic.max"]
        if (current_max > 1)
            this.set_slider_max(psychic, current_max - 1)

        // Adventure points
        compute_remaining_ap()
    }

    /* Update the tooltip */
    details_hp(e) {
        const hp_id = e.target.id.split("details-")[1]
        const hp = localized_hp ? this.find("[data-target=\"#" + this.full_id(hp_id) + "-max-update\"") : this.get("hp-title")
        const note = $(e.target).val()
        let text
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

    unease_value_changed_event() {
        sheet.get_all_rolls().forEach((row) => {
            row.update_roll_value()
        })
    }

    /* Enable all the sliders on load */
    init_status() {
        let current_temporary_breath = this["temporary-breath"]
        this.get("temporary-breath").on("change", _ => {
            const breath = this.get("breath")
            const current_max = this["breath.max"]

            let new_value = this["temporary-breath"]
            this.set_slider_max(breath, current_max - current_temporary_breath + new_value)
            current_temporary_breath = new_value
        })

        /**
         * Warning: Do not exchange unease and hp slider initializations
         * The initializations of the HP sliders need to set the unease slider if
         * player health is too low
         */

        if (localized_hp) {
            activate_slider(this.get("unease")[0], () => {
                return value => {
                    const max = this["unease.max"]
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
                    this.get("unease-text").text(text)
                    this.get("unease-value").text(unease)
                    return text
                }
            }, _ => void 0, {}, () => this.unease_value_changed_event())

            this.find(".hp-link").on("click", e => {
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

        // Initialize HP sliders
        let selector = []
        for (const member of this.constructor.hp_sliders) {
            selector.push("#" + this.full_id(member))
        }
        selector = selector.join(",")
        $(selector).each((i, input) => {
            activate_slider(input, build_max_formatter, slider => {
                $(slider.slider("getElement")).addClass("hp-slider")
                if ($(input).hasClass("hp-non-localized"))
                    $(slider.slider("getElement")).addClass("hp-non-localized")
                this.hp_update({target: slider[0]})
            }, {}, (e) => this.hp_update(e))
        })

        activate_slider(this.get("breath")[0], () => {
            return (value) => {
                if (value === 0)
                    return "K.O."
                return value + "/" + this["breath.max"]
            }
        })

        activate_slider(this.get("psychic")[0], () => {
            return (value) => {
                if (value === 0)
                    return "Fou"
                return value + "/" + this["psychic.max"]
            }
        })

        activate_slider(this.get("rest")[0])
    }

    add_listeners() {
        super.add_listeners()

        this.constructor.armors.forEach((armor) => {
            this.get(armor).on("change", _ => {
                this.recompute_armor_penalty()
            })
        })

        if (universe === med_fantasy) {
            this.get("shield").on("change", _ => {
                this.recompute_armor_penalty()
            })
        }

        this.constructor.hp_sliders.forEach((hp) => {
            this.get("increment-" + hp).on("click", (e) => this.increment_hp(e))
            this.get("decrement-" + hp).on("click", (e) => this.decrement_hp(e))
            this.get("details-" + hp).on("change", (e) => this.details_hp(e))
        })
        this.get("increment-unease").on("click", (e) => this.increment_unease(e))
        this.get("decrement-unease").on("click", (e) => this.decrement_unease(e))
        this.get("increment-breath").on("click", (e) => this.increment_breath(e))
        this.get("decrement-breath").on("click", (e) => this.decrement_breath(e))
        this.get("increment-psychic").on("click", (e) => this.increment_psychic(e))
        this.get("decrement-psychic").on("click", (e) => this.decrement_psychic(e))

        this.get("lost-breath").on("change", _ => {
            compute_remaining_ap()
        })
        this.get("lost-psychic").on("change", _ => {
            compute_remaining_ap()
        })

        this.init_status()
    }
}

class UnlocalizeStatus extends Status {
    static members = ["trunk"]
    static hp_sliders = this.members.map((e) => "hp-" + e)
    static sliders = [...super.sliders, ...this.hp_sliders]
    static save_slider_min_max = this.sliders

    static absorptions = intermediate_discovery ? [] : ["armor-absorption"]
    static armors = intermediate_discovery ? [] : ["armor", "armor-penalty-input"]
    static details = [...super.details, ...this.members.map((e) => "details-hp-" + e)]
    static numeric_inputs = [...(is_v7 ? ["temporary-breath"] : []), "lost-breath", "lost-psychic", ...this.absorptions, ...this.armors]
    static basic_inputs = [...this.details, ...this.numeric_inputs]
}

class LocalizedStatus extends Status {
    static members = ["trunk", "head", "left-arm", "left-leg", "right-arm", "right-leg"]
    static hp_sliders = this.members.map((e) => "hp-" + e)
    static sliders = [...super.sliders, ...this.hp_sliders]
    static save_slider_min_max = this.sliders

    static absorptions = this.members.map((e) => "absorption-" + e)
    static armors = this.members.map((e) => "armor-" + e)
    static details = [...super.details, ...this.members.map((e) => "details-hp-" + e)]
    static numeric_inputs = [...(is_v7 ? ["temporary-breath"] : []), "lost-breath", "lost-psychic", ...this.absorptions, ...this.armors]
    static basic_inputs = [...this.details, ...this.numeric_inputs]
}

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
