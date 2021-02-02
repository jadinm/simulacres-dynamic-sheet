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

const effect_column_regex = /(^|\W?)\[([ABCDEFGHIJK])([+-]\d+)?](\W?|$)/gi
const effect_margin_regex = /(^|\W?)(MR)(\W?|$)/gi
const effect_dss_regex = /(^|\W?)(DSS)(\W?|$)/gi
const effect_des_regex = /(^|\W?)(DES)(\W?|$)/gi

let critical_failure = false
let critical_success = false

const last_rolls = []
let current_roll = null

class Roll {
    constructor(number = 2, type = 6) {
        this.number = number
        this.type = type
        this.base_dices = []
        this.timestamp = new Date()

        // Add to the list of rolls
        last_rolls.push(this)
    }

    roll_dices(number, type, dices) {
        return roll_dices(number, type, dices)
    }

    dice_value() {
        if (this.base_dices.length === 0) {
            // Roll needed
            this.roll_dices(this.number, this.type, this.base_dices)
        }
        return this.base_dices.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    is_critical_failure() {
        return this.dice_value() === 12
    }

    is_critical_success() {
        return this.dice_value() <= 2
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

    modify_dialog(ignore_sliders) {
        // Reset text
        $("#roll-dialog-1d6-result").text("")
        $("#roll-dialog-2d6-result").text("")
        const critical_div = $("#roll-dialog-critical")
        critical_div.text("")

        // Check for critical rolls
        critical_failure = false
        critical_success = false
        if (this.is_critical_failure()) {
            critical_div.html("<b class='text-danger'>Échec critique... :'(</b>")
            critical_failure = true
        } else if (this.is_critical_success()) {
            critical_div.html("<b class='text-success'>Succès critique !</b>")
            critical_success = true
        }

        // Hide everything and show it afterwards if needed
        const roll_effect_divs = $(".roll-dialog-effect-hide")
        const roll_magic_divs = $(".roll-dialog-magic-hide")
        roll_effect_divs.addClass("d-none")
        roll_magic_divs.addClass("d-none")
        $(".roll-dialog-component-hide").addClass("d-none")
        $("#roll-dialog-result-label").html("Résultat du lancer de 2d6 = ")
        $("#roll-dialog-result").html(this.dice_value())
        $("#roll-dialog-details").html(this.dice_buttons("base_dices", this.base_dices)).removeClass("d-none")

        $("#roll-dialog-title").html("<h2>Résultat du lancer</h2>"
            + "<sm class='text-center'>" + this.timestamp.toLocaleString("fr-FR") + "</sm>")
    }

    make_dices_clickable() {
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
            $(document).trigger("update-roll", current_roll)
        }).tooltip({disabled: false})
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

        this.modify_dialog(ignore_sliders)

        // Make dices clickable to reroll
        this.make_dices_clickable()

        $(".roll-dialog-energy").parent().tooltip({disabled: false})
    }

    trigger_roll() {
        this.show_roll()
        $(document).trigger("roll", this)
    }
}

class TalentRoll extends Roll {
    constructor(reason = "", max_value = NaN, talent_level = 0, effect = "",
                critical_increase = 0, formula_elements = [], margin_throttle = NaN,
                is_magic = false, is_power = false, distance = "", focus = "",
                duration = "") {
        super()
        this.reason = reason
        this.formula_elements = formula_elements
        this.max_value = max_value
        this.margin_throttle = margin_throttle
        this.talent_level = talent_level
        this.effect = effect
        this.base_dices = []
        this.critical_dices = []
        this.effect_dices = []

        this.is_magic = is_magic
        this.is_power = is_power || is_magic
        this.distance = distance // Spell parameter increased by power
        this.focus = focus // Spell parameter decreased by speed
        this.duration = duration

        this.invested_energies = []
        this.critical_increase = critical_increase
        this.precision = NaN
        this.optional_precision = NaN
        this.power = NaN
        this.optional_power = NaN
        this.power_dices = []
        this.magic_power = NaN
        this.speed = NaN
        this.optional_speed = NaN
        this.update_energies()

        this.incantation = false
        this.somatic_component = false
        this.material_component = false
        this.update_components()

        this.unease = get_unease()
        this.armor_penalty = get_armor_penalty()
        this.timestamp = new Date()

        this.margin_modifier = 0
        this.effect_modifier = 0

        // Need to give energy investment or its magical components
        this.energy_investment_validated = !has_any_base_energy() && !is_magic
    }

    formula() {
        return $.map(this.formula_elements, (elem) => {
            const base_array = elem[0].id.split("-")
            return base_array[base_array.length - 1]
        })
    }

    column_effect(column, modifier) {
        const total = this.post_test_margin() + this.effect_value() + this.effect_modifier + modifier
        if (this.post_test_margin() <= 0 || total < 0)
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
        const components = this.is_magic ? this.incantation + this.somatic_component + this.material_component : 0
        return this.max_value + this.unease + this.power + this.speed + this.precision + this.margin_modifier
            + components
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
                input[0].setAttribute("value", String(current_value))
            }
        } else {
            current_value = 0
        }
        return current_value
    }

    update_energy_value(base_value, optional_value) {
        // If we are not in v7 and both value differs, it is due to heroism
        return base_value !== optional_value && this.energy_investment_validated && !is_v7 ? optional_value : base_value
    }

    update_energies(force_update = false) {
        const power_input = $("#roll-dialog-power")
        const power = this.update_energy(power_input, this.update_energy_value(this.power, this.optional_power), force_update)
        if (!this.energy_investment_validated)
            this.power = power

        const optional_power_input = $("#roll-dialog-optional-power")
        this.optional_power = optional_power_input.length > 0 ? this.update_energy(optional_power_input, this.optional_power, force_update) : power
        const magic_power_input = $("#roll-dialog-magic-power")
        this.magic_power = magic_power_input.length > 0 ? this.update_energy(magic_power_input, this.magic_power, force_update) : 0

        const speed_input = $("#roll-dialog-speed")
        const speed = this.update_energy(speed_input, this.update_energy_value(this.speed, this.optional_speed), force_update)
        if (!this.energy_investment_validated)
            this.speed = speed

        const optional_speed_input = $("#roll-dialog-optional-speed")
        this.optional_speed = optional_speed_input.length > 0 ? this.update_energy(optional_speed_input, this.optional_speed, force_update) : speed

        const precision_input = $("#roll-dialog-precision")
        const precision = this.update_energy(precision_input, this.update_energy_value(this.precision, this.optional_precision), force_update)
        if (!this.energy_investment_validated)
            this.precision = precision

        const optional_precision_input = $("#roll-dialog-optional-precision")
        this.optional_precision = optional_precision_input.length > 0 ? this.update_energy(optional_precision_input, this.optional_precision, force_update) : precision

        /* Update remaining max on energies */
        update_max_invested_energies($("#power")[0])
        update_max_invested_energies($("#speed")[0])
        update_max_invested_energies($("#precision")[0])
    }

    update_component(input, current_value, force_update = false) {
        if (input.length > 0) {
            if (force_update) {
                console.log("ERASE")
                current_value = input.prop("checked") || false
                console.log(current_value)
            } else { // Update input
                if (current_value) {
                    console.log("CHECK")
                    check_radio(input[0])
                } else {
                    console.log("UNCHECK")
                    uncheck_checkbox(input[0])
                }
            }
        } else {
            current_value = false
        }
        return current_value
    }

    update_components(force_update = false) {
        console.log("incantation")
        const incantation = this.update_component($("#roll-dialog-incantation"), this.incantation, force_update)
        if (!this.energy_investment_validated)
            this.incantation = incantation

        console.log("somatic")
        const somatic_component = this.update_component($("#roll-dialog-somatic-component"), this.somatic_component,
            force_update)
        if (!this.energy_investment_validated)
            this.somatic_component = somatic_component

        console.log("material")
        const material_component = this.update_component($("#roll-dialog-material-component"), this.material_component,
            force_update)
        if (!this.energy_investment_validated)
            this.material_component = material_component
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

    power_dices_activated() {
        return this.power_dices.slice(0, this.optional_power)
    }

    power_value() {
        if (!this.is_success())
            return 0
        if (this.power_dices.length === 0) {
            // Power can only be increased up to 3 => roll all the dices directly
            this.roll_dices(3, 6, this.power_dices)
        }
        return this.power_dices_activated().reduce((a, b) => {
            return a + b;
        }, 0);
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

    critical_success_text() {
        if (discovery)
            return "<div class='row mx-1 align-middle'>Doublez l'effet grâce au succès critique</div>"
        else
            return "<div class='row mx-1 align-middle'>" + this.critical_dices.length + "d6 ajouté" + ((this.critical_dices.length > 1) ? "s" : "")
                + " à la marge d'une valeur de " + this.critical_value() + this.dice_buttons("critical_dices", this.critical_dices) + "</div>"
    }

    critical_failure_text() {
        return "<div class='row mx-1 align-middle'>La marge est maximum 0 et c'est un échec</div>"
    }

    details_text() {
        let effect_text = isNaN(this.margin_throttle) ? "" : "<div class='row mx-1 align-middle'>La marge maximum est de "
            + this.margin_throttle + "</div>"
        if (this.energy_investment_validated) {
            let effect_dices_sum = 0
            if (this.is_success() && this.optional_power > 0 && this.power_value() >= 0) {
                effect_text += "<div id='roll-dialog-power-test' class='row mx-1 align-middle'>" + this.optional_power + "d6 de puissance rajoutés = "
                    + this.power_value() + this.dice_buttons("power_dices", this.power_dices_activated()) + "</div>"
            }
            if (is_v7) {
                // Roll the two additional dices
                effect_dices_sum = this.effect_value()
                effect_text += "<div class='row mx-1 align-middle'>Dés d'effet = " + effect_dices_sum
                    + this.dice_buttons("effect_dices", this.effect_dices) + "</div>"
            } else if (!discovery) {
                // DSS = MR // 3 and DES = 0 or (1 if 4 <= ME <= 6) or (2 if ME >= 7)
                effect_text += "<div class='row mx-1 align-middle'>DSS =&nbsp;<span class='roll-dialog-dss'>" + this.dss()
                    + "</span></div><div class='row mx-1 align-middle'>DES =&nbsp;<span class='roll-dialog-des'>" + this.des() + "</span></div>"
            }
        }

        let racial_bonus = ""
        const formula = this.formula()
        for (let i in formula) {
            if (formula[i] === "resistance" && is_hobbit()) {
                racial_bonus = " (bonus ethnique déjà appliqué)" +
                    "</div><div class='row mx-1 align-middle'>Ce test est raté s'il s'agit de résister à l'hypnose ou aux illusions"
            }
        }

        let superpower_bonus = ""
        for (let i in formula) {
            if (SuperpowerRollTable.components().includes(formula[i])) {
                superpower_bonus = "</div><div class='row mx-1 align-middle'> La composante utilisée est celle d'un super-pouvoir (bonus de +4 déjà appliqué)"
            }
        }

        const threshold_name = intermediate_discovery ? "Valeur du test <=" : "Valeur seuil ="
        let details_text
        if (this.energy_investment_validated) {
            details_text = "<div class='row mx-1 align-middle'>Somme des 2d6 = " + this.dice_value()
                + this.dice_buttons("base_dices", this.base_dices)
                + "</div><div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + superpower_bonus + "</div>"
        } else {
            details_text = "<div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + "</div>"
        }

        return [details_text, effect_text]
    }

    modify_dialog(ignore_sliders) {

        // Reset text
        $("#roll-dialog-1d6-result").text("")
        $("#roll-dialog-2d6-result").text("")
        const critical_div = $("#roll-dialog-critical")
        critical_div.text("")

        // Check for critical rolls
        let text_end = ""
        critical_failure = false
        critical_success = false
        this.update_energies()
        if (this.energy_investment_validated && this.is_critical_failure()) {
            critical_div.html("<b class='text-danger'>Échec critique... :'(</b>")
            text_end = this.critical_failure_text()
            critical_failure = true
        } else if (this.energy_investment_validated && this.is_critical_success()) {
            critical_div.html("<b class='text-success'>Succès critique !</b>")
            text_end = this.critical_success_text()
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
        const roll_component_divs = $(".roll-dialog-component-hide")

        roll_effect_divs.removeClass("d-none")
        if (this.is_power)
            roll_magic_divs.removeClass("d-none")
        else
            roll_magic_divs.addClass("d-none")
        if (this.is_magic)
            roll_component_divs.removeClass("d-none")
        else
            roll_component_divs.addClass("d-none")

        const result = $("#roll-dialog-result")
        const energy_inputs = $(".roll-dialog-energy")
        const component_inputs = $(".roll-dialog-component")
        if (this.energy_investment_validated) {
            const validate_button = $("#roll-dialog-validate")
            validate_button.addClass("d-none")
            const heroism = $("#heroism")
            component_inputs.attr("disabled", "disabled")
            if (heroism.length === 0 || parseInt(heroism.val()) === 0) {
                energy_inputs.attr("disabled", "disabled")
            } else { // You can invest in other energies with heroism only if this was not done before roll
                energy_inputs.each((i, elem) => {
                    if (this.invested_energies.includes(elem.id) || !this.is_success())
                        $(elem).attr("disabled", "disabled")
                    else
                        $(elem).removeAttr("disabled", "disabled")
                })
            }

            result[0].setAttribute("value", this.post_test_margin().toString())
            result.html(this.post_test_margin())

            set_result_label(this.post_test_margin())
        } else {
            result.html("")
            energy_inputs.removeAttr("disabled", "disabled")
            component_inputs.removeAttr("disabled", "disabled")
        }

        $(".energy").each((i, elem) => {
            update_energy_investment_list(elem)
        })

        const details = $("#roll-dialog-details")
        const details_texts = this.details_text()
        if (this.energy_investment_validated) {
            $("#roll-dialog-result-label").removeClass("d-none")
        } else {
            $("#roll-dialog-result-label").addClass("d-none")
        }
        details.html(details_texts[0] + text_end + details_texts[1])

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

        let effect = ""
        if (this.is_power && this.duration.length > 0) {
            effect += "<div class='row mx-1 align-middle'>Durée de l'effet: " + this.duration + "</div>" + effect
        }
        effect += "<div class='row mx-1 align-middle'>Effet:</div><div class='row mx-1 align-middle'>" + this.effect

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
        effect += "</div>"

        if (this.is_power && this.distance.length > 0) {
            const distance = this.distance.replaceAll(/\d+/gi, (match) => {
                return String(parseInt(match) * Math.pow(2, this.magic_power))
            })
            effect = "<div class='row mx-1 align-middle'>Portée: " + distance + "</div>" + effect
        }
        if (this.is_power && this.focus.length > 0) {
            const components = this.is_magic ? this.incantation + this.somatic_component + this.material_component : 0
            const focus = this.focus.replaceAll(/\d+/gi, (match) => {
                return String((1 + components) * parseInt(match) / Math.pow(2, this.optional_speed))
            })
            effect = "<div class='row mx-1 align-middle'>Durée de concentration: " + focus + "</div>" + effect
        }

        // Update with the MR if "MR" is in the text
        $("#roll-dialog-effect").html(effect)

        let title = "<h2>" + ((this.reason.length > 0) ? this.reason : "Résultat du lancer")
            + "</h2>"
        if (this.formula_elements.length > 0) {
            title += "<h4>"
            for (let i = 0; i < this.formula_elements.length; i++) {
                const symbol = $("label[for='" + this.formula_elements[i][0].id + "'] svg").get(0)
                if (symbol) {
                    title += symbol.outerHTML
                    if (i !== this.formula_elements.length - 1)
                        title += "&nbsp;+&nbsp;"
                }
            }
            title += "</h4>"
        }
        $("#roll-dialog-title").html(title
            + "<sm class='text-center'>" + this.timestamp.toLocaleString("fr-FR") + "</sm>")

        $("label[for='roll-dialog-optional-power']").text("MR + 1d6 (si réussi)")
        $("label[for='roll-dialog-optional-precision']").text("Seuil critique + 1")
        $(".roll-dialog-superpower-slider").addClass("d-none")
    }

    trigger_roll() {
        this.show_roll()
        if (this.energy_investment_validated)
            $(document).trigger("roll", this)
    }
}

class SuperpowerRoll extends TalentRoll {

    constructor(reason = "", nbr_dices = 0, under_value = 0, formula_elements = [],
                distance = "", focus = "", duration = "", effect = "") {
        super(reason, NaN, 0, effect, 0, formula_elements, NaN, false, true, distance, focus, duration)
        this.number = nbr_dices
        this.under_value = under_value
        this.superpower_modifier = 0
    }

    max_threshold() {
        return this.under_value + (!isNaN(this.optional_precision) ? this.optional_precision : 0)
    }

    nbr_successes() {
        return this.dice_value() + this.critical_value() + this.power_value() + this.superpower_modifier
    }

    margin() {
        if (this.is_critical_failure()) // Cannot have more than 0 in case of critical failure
            return 0
        const modifier = this.power + this.speed + this.precision + this.margin_modifier + this.unease
        if (this.nbr_successes() <= 0)
            return modifier
        return Math.pow(3, this.nbr_successes()) + modifier
    }

    post_test_margin() {
        return this.margin()
    }

    dice_value() {
        if (this.base_dices.length === 0) {
            // Roll needed
            this.roll_dices(this.number, this.type, this.base_dices)
        }
        return this.base_dices.map((elem) => {
            return (elem <= this.max_threshold()) ? 1 : 0
        }).reduce((a, b) => {
            return a + b
        }, 0)
    }

    power_value() {
        if (this.power_dices.length === 0) {
            // Power can only be increased up to 3 => roll all the dices directly
            this.roll_dices(3, 6, this.power_dices)
        }
        return this.power_dices_activated().map((elem) => {
            return (elem <= this.max_threshold()) ? 1 : 0
        }).reduce((a, b) => {
            return a + b
        }, 0)
    }

    critical_value() {
        if (!this.is_critical_success()) {
            return 0
        }
        if (this.critical_dices.length === 0) {
            this.roll_dices(1, 6, this.critical_dices)
        }
        return this.critical_dices[0] <= this.max_threshold() ? 1 : 0
    }

    is_critical_success() {
        // If all dices are equal to 1, this is a critical success
        this.dice_value()
        return this.base_dices.filter((elem) => {
            return elem !== 1
        }).length === 0
    }

    is_critical_failure() {
        // If all dices are equal to 6, this is a critical failure
        this.dice_value()
        return this.base_dices.filter((elem) => {
            return elem !== 6
        }).length === 0
    }

    is_success() {
        return !this.is_critical_failure()
            && (this.margin() > 0 || this.is_critical_success())
    }

    critical_success_text() {
        return "<div class='row mx-1 align-middle'>Grâce au succès critique, le dé"
            + this.dice_buttons("critical_dices", this.critical_dices) + "est ajouté "
            + (this.critical_value() === 0 ? " mais n'augmente pas le nombre de réussites"
                : " qui augmente le nombre de réussites de " + this.critical_value())
            + "</div>"
    }

    critical_failure_text() {
        return "<div class='row mx-1 align-middle'>Une catastrophe d'une ampleur gigantesque arrive au super-héros," +
            " en fonction du nombre de 6</div>"
    }

    details_text() {
        let effect_text = ""
        if (this.energy_investment_validated) {
            if (this.optional_power > 0) {
                effect_text += "<div class='row mx-1 align-middle'>" + this.optional_power + "d6 de puissance " +
                    "rajouté" + (this.optional_power > 1 ? "s" : "") + " au test initial qui augmente"
                    + (this.optional_power > 1 ? "nt" : "") + " le nombre de réussites de " + this.power_value() +
                    this.dice_buttons("power_dices", this.power_dices_activated()) + "</div>"
            }
            if (is_v7) {
                // Roll the two additional dices
                const effect_dices_sum = this.effect_value()
                effect_text += "<div class='row mx-1 align-middle'>Dés d'effet = " + effect_dices_sum
                    + this.dice_buttons("effect_dices", this.effect_dices) + "</div>"
            } else if (!discovery) {
                // DSS = MR // 3 and DES = 0 or (1 if 4 <= ME <= 6) or (2 if ME >= 7)
                effect_text += "<div class='row mx-1 align-middle'>DSS =&nbsp;<span class='roll-dialog-dss'>" + this.dss()
                    + "</span></div><div class='row mx-1 align-middle'>DES =&nbsp;<span class='roll-dialog-des'>" + this.des() + "</span></div>"
            }
        }

        let racial_bonus = ""
        const formula = this.formula()
        for (let i in formula) {
            if (formula[i] === "resistance" && is_hobbit()) {
                racial_bonus = " (bonus ethnique déjà appliqué)" +
                    "</div><div class='row mx-1 align-middle'>Ce test est raté s'il s'agit de résister à l'hypnose ou aux illusions"
            }
        }

        const threshold_name = "Valeur seuil de chaque dé ="
        let details_text
        if (this.energy_investment_validated) {
            details_text = "<div class='row mx-1 align-middle'>Nombre de réussites = " + this.dice_value()
                + this.dice_buttons("base_dices", this.base_dices)
                + "</div><div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + "</div>"
        } else {
            details_text = "<div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + "</div>"
        }

        return [details_text, effect_text]
    }

    modify_dialog(ignore_sliders) {
        super.modify_dialog(ignore_sliders)
        $("label[for='roll-dialog-optional-power']").text("Dés lancés + 1")
        $("label[for='roll-dialog-optional-precision']").text("Seuil + 1")
        const modifier = $("#roll-dialog-superpower-modifier")
        if (!ignore_sliders) {
            modifier.slider("setValue", this.superpower_modifier)
            modifier.slider("refresh", {useCurrentValue: true})
        }
        if (this.energy_investment_validated) {
            $(".roll-dialog-superpower-slider").removeClass("d-none")
        }
    }
}

function slider_value_changed(input) {
    return modifier => {
        return modifier
    }
}

let timed_action = null

function timed_update_roll_trigger() {
    // We trigger the update-roll at most twice a second
    // and we keep the last trigger
    if (timed_action != null)
        clearTimeout(timed_action)
    timed_action = setTimeout(_ => {
        $(document).trigger("update-roll", current_roll)
    }, 500);
}

function slider_value_changed_event(e) {
    const input = e.target
    const modifier = parseInt($(input).val())
    /* When it is called on creation, current_roll is null */
    if (!current_roll || isNaN(modifier))
        return

    if (input.id === "roll-dialog-modifier") { // Modify the MR only for MR modifier
        current_roll.margin_modifier = modifier
        current_roll.show_roll(true)
        timed_update_roll_trigger()
    } else if (input.id === "roll-dialog-superpower-modifier") {
        current_roll.superpower_modifier = modifier
        current_roll.show_roll(true)
        timed_update_roll_trigger()
    } else if (input.id === "roll-dialog-effect-modifier") {
        current_roll.effect_modifier = modifier
        timed_update_roll_trigger()
    }

    // Update with scaled effect in the text
    $(".roll-dialog-effect").each((i, elem) => {
        const column = elem.getAttribute("column")
        let column_modifier = elem.getAttribute("modifier")
        column_modifier = column_modifier.length > 0 ? parseInt(column_modifier) : 0
        const effect_value = current_roll.column_effect(column, column_modifier)
        $(elem).html(effect_value)
    })
}

$(_ => {
    activate_slider($("#roll-dialog-modifier")[0], slider_value_changed, _ => void 0,
        {tooltip: "always"}, slider_value_changed_event)
    const effect_modifier = $("#roll-dialog-effect-modifier")
    if (effect_modifier.length > 0)
        activate_slider(effect_modifier[0], slider_value_changed, _ => void 0,
            {tooltip: "always"}, slider_value_changed_event)
    activate_slider($("#roll-dialog-superpower-modifier")[0], slider_value_changed, _ => void 0,
        {tooltip: "always"}, slider_value_changed_event)
})

/* Quick roll button */

$("#roll-2d6").on("click", _ => {
    // Reset invested energies
    $(".roll-dialog-energy").val(0)
    $(".roll-dialog-component").each((i, elem) => uncheck_checkbox(elem))
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
    if (discovery)
        return
    const heroism = $("#heroism")
    let heroism_value = heroism.length > 0 ? parseInt(heroism.val()) : 0
    if (isNaN(heroism_value) || !current_roll || !current_roll.energy_investment_validated)
        heroism_value = 0
    heroism_value = Math.min(2, heroism_value)
    let value = parseInt(energy_input.value)
    if (isNaN(value))
        value = 0
    const elems = get_energy_investment_inputs(energy_input)
    let remaining = Math.max(value, heroism_value)
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
        invested.setAttribute("max", current_value + Math.max(0, remaining))
    })
}

function update_energy_investment_list(input) {
    let value = parseInt(input.value)
    if (isNaN(value))
        value = 0
    get_energy_investment_inputs(input).each((i, invested) => {
        const title = $(".roll-dialog-energy-investment")
        const heroism = $("#heroism")
        if (value > 0 || current_roll && current_roll.energy_investment_validated && heroism.length > 0 && parseInt(heroism.val()) > 0 && current_roll.is_success()) {
            // If you have heroism, you can invest in one or two points in any energy that you want in case of success
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
    update_max_invested_energies(input)
}

$(".energy").on("change", event => {
    update_energy_investment_list(event.target)
})

$(".roll-dialog-energy").on("change", e => {
    if (!current_roll)
        return
    // Trigger the same roll but with the correct precision
    current_roll.update_energies(true)
    $(e.target).parent().tooltip("dispose")
    current_roll.show_roll()
})

$(".roll-dialog-component").on("click", _ => {
    if (!current_roll)
        return
    current_roll.update_components(true)
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
    const invested_energies = []
    $(".roll-dialog-energy[value!='0']").each((i, elem) => {
        invested_energies.push(elem.id)
    })
    current_roll.invested_energies = invested_energies
    current_roll.show_roll()
    $(document).trigger("roll", current_roll)
})
