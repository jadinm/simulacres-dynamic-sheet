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

const effect_column_regex = /(^|\W?)\[ *([ABCDEFGHIJK]) *([+-] *\d+)? *](\W?|$)/gi
const effect_margin_regex = /(^|\W?)(MR)(\W?|$)/g
const effect_dss_regex = /(^|\W?)(DSS)(\W?|$)/g
const effect_des_regex = /(^|\W?)(DES)(\W?|$)/g

let critical_failure = false
let critical_success = false

const last_rolls = []
let current_roll = null

class Roll {
    constructor(number = 2, type = 6) {
        // Reset all invested energies
        $(".roll-dialog-energy").val(0)
        $(".roll-dialog-component").each((i, elem) => uncheck_checkbox(elem))

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
        return this.dice_value() === 12 && this.type === 6 && this.number === 2
    }

    is_critical_success() {
        return this.dice_value() <= 2 && this.type === 6 && this.number === 2
    }

    dice_buttons(dice_group, dices = [], type = 6) {
        const digits = ["", "one", "two", "three", "four", "five", "six"]
        let text = "&nbsp;"
        for (let i in dices) {
            if (dices[i] > 0 && dices[i] <= 6)
                text += '<span class="clickable btn-link roll-link" data-dice-group="' + dice_group
                    + '" data-dice-type="' + type + '" data-dice-idx="' + i
                    + '" data-toggle="tooltip" data-placement="bottom" title="Relancer le dé">' +
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

        // If this is a 1d6, it could be for localisation
        if (localized_target_hp && this.type === 6 && this.number === 1) {
            $("#localisation-row-" + this.base_dices[0]).addClass("success-color-dark")
        }

        // Hide everything and show it afterwards if needed
        const roll_effect_divs = $(".roll-dialog-effect-hide")
        const roll_magic_divs = $(".roll-dialog-magic-hide")
        roll_effect_divs.addClass("d-none")
        roll_magic_divs.addClass("d-none")
        $(".roll-dialog-equipment-hide").addClass("d-none")
        $(".roll-dialog-component-hide").addClass("d-none")
        $("#roll-dialog-result-label").html("Résultat du lancer de " + this.number + "d" + this.type + " = ")
        $("#roll-dialog-result").html(this.dice_value())
        $("#roll-dialog-details").html(this.dice_buttons("base_dices", this.base_dices)).removeClass("d-none")
        $("#roll-dialog-redo").removeClass("d-none").prev().removeClass("d-none")

        $("#roll-dialog-title").html("<h2>Résultat du lancer</h2>"
            + "<sm class='text-center'>" + this.timestamp.toLocaleString("fr-FR") + "</sm>")
    }

    make_dices_clickable() {
        const roll_fn = this.roll_dices
        $(".roll-link").on("click", e => {
            let target = $(e.target)
            if (!target.hasClass("roll-link"))
                target = target.parents(".roll-link")

            const type = target.attr("data-dice-type")
            const new_value = roll_fn(1, type ? type : 6)
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

        // Hide tab highlights
        $(".localisation-row").removeClass("success-color-dark")
        $("#damage-tab td").removeClass("success-color-dark")

        this.modify_dialog(ignore_sliders)

        // Make dices clickable to reroll
        this.make_dices_clickable()

        $(".roll-dialog-energy").parent().tooltip({disabled: false})
    }

    trigger_roll() {
        this.show_roll()
        $(document).trigger("roll", this)
    }

    /* Trigger the same roll */
    reroll() {
        new this.constructor(this.number, this.type).trigger_roll()
    }
}

class TalentRoll extends Roll {

    labels = {
        "power": "Test + 1",
        "speed": "Test + 1",
        "precision": "Test + 1",
        "optional-power": "MR + 1d6 (si réussi)",
        "optional-speed": "Temps / 2",
        "optional-precision": "Seuil critique + 1",
        "magic-power": "Distance &times; 2"
    }
    tooltips = {
        "power": "Puissance investie pour augmenter la marge",
        "speed": "Rapidité investie pour augmenter la marge",
        "precision": "Précision investie pour augmenter la marge",
        "optional-power": "Puissance investie pour augmenter la marge de 1d6 en cas de réussite",
        "optional-speed": "Rapidité investie pour diminuer le temps de l'action",
        "optional-precision": "Précision investie pour augmenter le seuil de succès critique",
        "magic-power": "Puissance investie pour augmenter la portée ou la zone d'effet d'une capacité"
    }

    /* Trigger the same roll */
    reroll() {
        new this.constructor(this.reason, this.max_value, this.talent_level, this.effect, this.critical_increase,
            this.formula_elements, this.margin_throttle, this.is_magic, this.is_power, this.distance, this.focus,
            this.duration, this.base_energy_cost, this.black_magic, this.magic_resistance,
            this.equipment, this.equipment_id).trigger_roll()
    }

    constructor(reason = "", max_value = NaN, talent_level = 0, effect = "",
                critical_increase = 0, formula_elements = [], margin_throttle = NaN,
                is_magic = false, is_power = false, distance = "", focus = "",
                duration = "", base_energy_cost = 0, black_magic = "",
                magic_resistance = "", equipment = "", equipment_id = "") {
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
        this.localisation_dices = []
        if (localized_target_hp)
            this.roll_dices(2, 6, this.localisation_dices)

        this.is_magic = is_magic
        this.is_power = is_power || is_magic
        this.distance = distance // Spell parameter increased by power
        this.focus = focus // Spell parameter decreased by speed
        this.duration = duration
        this.base_energy_cost = parseInt(base_energy_cost)
        if (isNaN(this.base_energy_cost))
            this.base_energy_cost = 0
        this.black_magic = black_magic ? black_magic : ""
        this.magic_resistance = magic_resistance ? magic_resistance : ""

        // Equipment-dependent roll
        this.equipment = equipment
        this.equipment_id = equipment_id
        this.expended_charge = NaN

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

    energy_cost() {
        if (is_v7) {
            return this.base_energy_cost + this.power + this.speed + this.precision + this.optional_power
                + this.optional_speed + this.optional_precision + this.magic_power
        } else {
            // heroism counts in the optional part only
            return this.base_energy_cost + 2 * this.power - this.optional_power
                + 2 * this.speed - this.optional_speed + 2 * this.precision - this.optional_precision
        }
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

        // Find the column index in the damage table
        let column_idx = -1
        $("#damage-tab thead th").each((i, elem) => {
            if ($(elem).text() === column) {
                column_idx = i
            }
        })

        if (total > 26) {
            const additional_ranges = Math.ceil((total - 26) / 4)
            if (column_idx > 0) {
                // Highlight the appropriate cell
                $("#damage-tab tbody tr").last().find("td").eq(column_idx - 1).addClass("success-color-dark")
            }
            return effect_table[column][26] + effect_upgrade[column] * additional_ranges
        }

        if (column_idx > 0) {
            // Highlight the appropriate cell
            $("#damage-tab tbody tr").filter((i, elem) => {
                // Find the row matching the value
                return $(elem).find("th").text().match(new RegExp("^(\\d+ )*" + total + "( \\d+)*$"))
            }).find("td").eq(column_idx - 1).addClass("success-color-dark")
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
        return this.max_value + this.power + this.speed + this.precision + this.margin_modifier
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
                current_value = input.prop("checked") || false
            } else { // Update input
                if (current_value) {
                    check_radio(input[0])
                } else {
                    uncheck_checkbox(input[0])
                }
            }
        } else {
            current_value = false
        }
        return current_value
    }

    update_components(force_update = false) {
        const incantation = this.update_component($("#roll-dialog-incantation"), this.incantation, force_update)
        if (!this.energy_investment_validated)
            this.incantation = incantation

        const somatic_component = this.update_component($("#roll-dialog-somatic-component"), this.somatic_component,
            force_update)
        if (!this.energy_investment_validated)
            this.somatic_component = somatic_component

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
            this.roll_dices(3, this.type, this.power_dices)
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
        else {
            const value = this.critical_value() // Triggers the roll
            return "<div class='row mx-1 align-middle'>" + this.critical_dices.length + "d6 ajouté" + ((this.critical_dices.length > 1) ? "s" : "")
                + " à la marge d'une valeur de " + value + this.dice_buttons("critical_dices", this.critical_dices) + "</div>"
        }
    }

    critical_failure_text() {
        return "<div class='row mx-1 align-middle'>La marge est maximum 0 et c'est un échec</div>"
    }

    energy_cost_text() {
        if (this.energy_cost() === 0)
            return ""
        if (this.is_magic) {
            let text = "</div><div class='row mx-1 align-middle'>Coût en Points de Magie: "
            if (this.energy_investment_validated && this.is_critical_success() && this.energy_cost() > 1) {
                text += "Entre 1 et " + this.energy_cost() + " (les points dépensés par un focus sont quand-même dépensés)"
            } else if (this.energy_investment_validated && this.is_critical_failure()) {
                text += (2 * this.energy_cost())
                    + "</div><div class='row mx-1 align-middle'>Le coût est doublé à cause de l'échec critique"
                    + "</div><div class='row mx-1 align-middle'>La perte en plus est à retirer d'abord du focus" +
                    " (si un a été utilisé), puis des PS, après des EP et enfin en PV."
            } else {
                text += this.energy_cost()
            }
            return text
        } else {
            return "</div><div class='row mx-1 align-middle'>Coût en énergies: " + this.energy_cost()
        }
    }

    format_details(racial_bonus, superpower_bonus) {
        const threshold_name = intermediate_discovery ? "Valeur du test <=" : "Valeur seuil ="
        if (this.energy_investment_validated) {
            return "<div class='row mx-1 align-middle'>Somme des 2d6 = " + this.dice_value()
                + this.dice_buttons("base_dices", this.base_dices)
                + "</div><div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + superpower_bonus + this.energy_cost_text()
                + "</div>"
        } else {
            return "<div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + superpower_bonus + this.energy_cost_text()
                + "</div>"
        }
    }

    details_text() {
        let effect_text = isNaN(this.margin_throttle) ? "" : "<div class='row mx-1 align-middle'>La marge maximum est de "
            + this.margin_throttle + "</div>"
        if (this.energy_investment_validated) {
            let effect_dices_sum = 0
            if (this.is_success() && this.optional_power > 0 && this.power_value() >= 0) {
                effect_text += "<div id='roll-dialog-power-test' class='row mx-1 align-middle'>" + this.optional_power
                    + "d" + this.type + " de puissance rajoutés = "
                    + this.power_value() + this.dice_buttons("power_dices", this.power_dices_activated(), this.type) + "</div>"
            }
            if (is_v7) {
                // Roll the two additional dices
                effect_dices_sum = this.effect_value()
                effect_text += "<div class='row mx-1 align-middle'>Dés d'effet = " + effect_dices_sum
                    + this.dice_buttons("effect_dices", this.effect_dices) + "</div>"
                if (this.localisation_dices.length > 0) {
                    effect_text += "<div class='row mx-1 align-middle'>"
                    const localisation_six = this.localisation_dices[0] === 6
                    effect_text += "Dé" + (localisation_six ? "s" : "") +  " de localisation ="
                        + this.dice_buttons("localisation_dices",
                            this.localisation_dices.slice(0, (localisation_six ? 2 : 1)))
                    if (localisation_six) {
                        effect_text += ((this.localisation_dices[1] % 2 === 0) ? "&nbsp;6 pair" : "&nbsp;6 impair")
                    }
                    effect_text += "</div>"
                }
            } else if (!discovery) {
                // DSS = MR // 3 and DES = 0 or (1 if 4 <= ME <= 6) or (2 if ME >= 7)
                effect_text += "<div class='row mx-1 align-middle'>DSS =&nbsp;" + this.dss()
                    + "</div><div class='row mx-1 align-middle'>DES =&nbsp;" + this.des() + "</div>"
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

        let details_text = this.format_details(racial_bonus, superpower_bonus)
        return [details_text, effect_text]
    }

    title_formula() {
        let title = ""
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
        return title
    }

    modify_dialog(ignore_sliders) {

        // Reset text
        $("#roll-dialog-1d6-result").text("")
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
            penalty_text += "\nMalaise d'armure: " + this.armor_penalty + " (à appliquer manuellement sur les actions physiques)\n"
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

        const equipment_divs = $(".roll-dialog-equipment-hide")
        const equipment_remaining = $("#roll-dialog-remaining-equipment")
        let charges = NaN
        if (this.equipment) {
            const equipment_elem = $("#" + this.equipment_id)
            if (equipment_elem.length > 0) {
                const row = row_of(equipment_elem)
                charges = row.current_charges()
                if (!isNaN(charges)) {
                    equipment_remaining.text("il en reste " + charges)
                    if (charges === 0) {
                        equipment_remaining.addClass("text-warning")
                    } else {
                        equipment_remaining.removeClass("text-warning")
                    }

                    const charges_div = $("#roll-dialog-expended-charges")
                    if (charges === 0 && isNaN(this.expended_charge)) {
                        charges_div.val(0)
                    } else if (isNaN(this.expended_charge)) {
                        charges_div.val(1)
                    }
                    charges_div.attr("max", charges)
                    charges_div.trigger("change")

                    $("#roll-dialog-unit-equipment").text(row.unit())
                    $("#roll-dialog-expended-equipment").text(this.equipment)

                    equipment_divs.removeClass("d-none")
                } else {
                    equipment_divs.addClass("d-none")
                }
            } else {
                equipment_divs.addClass("d-none")
            }
        } else {
            equipment_divs.addClass("d-none")
        }
        const equipment_to_disable_div = $("#roll-dialog-expended-charges,#roll-dialog-validate-equipment")
        if (!isNaN(this.expended_charge) || isNaN(charges) || charges === 0)
            equipment_to_disable_div.addClass("disabled")
        else
            equipment_to_disable_div.removeClass("disabled")

        const result = $("#roll-dialog-result")
        const energy_inputs = $(".roll-dialog-energy")
        const component_inputs = $(".roll-dialog-component")

        energy_inputs.each((i, elem) => {
            const tooltip_div = $(elem).parent()
            const key = elem.id.replace("roll-dialog-", "")
            tooltip_div.attr("data-original-title", this.tooltips[key])
            tooltip_div.tooltip("update")
            tooltip_div.find("label").html(this.labels[key])
        })

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

            $("#localisation-row-" + this.localisation_dices[0]).addClass("success-color-dark")
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
                    modifier = typeof modifier === "undefined" ? 0 : parseInt(modifier.replaceAll(" ", ""))
                    const effect_value = this.is_success() ? this.column_effect(column, modifier) : 0
                    return prefix.replace(" ", "&nbsp;") + effect_value + suffix.replace(" ", "&nbsp;")
                })
            } else {
                // Update with the DSS if "DSS" is in the text
                effect = effect.replaceAll(effect_dss_regex, (match, prefix, _, suffix) => {
                    return prefix.replace(" ", "&nbsp;") + this.dss() + suffix.replace(" ", "&nbsp;")
                })
                effect = effect.replaceAll(effect_des_regex, (match, prefix, _, suffix) => {
                    return prefix.replace(" ", "&nbsp;") + this.des() + suffix.replace(" ", "&nbsp;")
                })
            }
            effect = effect.replaceAll(effect_margin_regex, (match, prefix, _, suffix) => {
                return prefix.replace(" ", "&nbsp;") + this.post_test_margin() + suffix.replace(" ", "&nbsp;")
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
        if (this.magic_resistance.length > 0) {
            effect = "<div class='row mx-1 align-middle'>Résistance: " + this.magic_resistance + "</div>" + effect
        }
        if (this.black_magic.length > 0) {
            effect = "<div class='row mx-1 align-middle'>Magie noire: " + this.black_magic + "</div>" + effect
        }

        // Update with the MR if "MR" is in the text
        $("#roll-dialog-effect").html(effect)

        let title = "<h2>" + ((this.reason.length > 0) ? this.reason : "Résultat du lancer")
            + "</h2>"
        title += this.title_formula()
        $("#roll-dialog-title").html(title
            + "<sm class='text-center'>" + this.timestamp.toLocaleString("fr-FR") + "</sm>")

        $(".roll-dialog-superpower-slider").addClass("d-none")

        if (this.energy_investment_validated) {
            $("#roll-dialog-redo").removeClass("d-none").prev().removeClass("d-none")
        } else {
            $("#roll-dialog-redo").addClass("d-none").prev().addClass("d-none")
        }
    }

    trigger_roll() {
        this.show_roll()
        if (this.energy_investment_validated)
            $(document).trigger("roll", this)
    }
}

class SuperpowerRoll extends TalentRoll {

    /* Trigger the same roll */
    reroll() {
        new this.constructor(this.reason, this.number, this.under_value, this.formula_elements, this.distance,
            this.focus, this.duration, this.effect, this.equipment, this.equipment_id).trigger_roll()
    }

    constructor(reason = "", nbr_dices = 0, under_value = 0, formula_elements = [],
                distance = "", focus = "", duration = "", effect = "",
                equipment = "", equipment_id = "") {
        super(reason, NaN, 0, effect, 0, formula_elements, NaN, false, true, distance, focus, duration, 0, "", "",
            equipment, equipment_id)
        this.number = nbr_dices
        this.under_value = under_value
        this.superpower_modifier = 0
        this.labels["optional-power"] = "Dés lancés + 1"
        this.labels["optional-precision"] = "Seuil + 1"
        this.tooltips["optional-power"] = "Puissance investie pour augmenter le nombre de dés lancés"
        this.tooltips["optional-precision"] = "Précision investie pour augmenter le seuil de succès des dés lancés"
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
                + this.max_threshold() + "</span>" + racial_bonus + this.energy_cost_text() + "</div>"
        } else {
            details_text = "<div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + this.energy_cost_text() + "</div>"
        }

        return [details_text, effect_text]
    }

    modify_dialog(ignore_sliders) {
        super.modify_dialog(ignore_sliders)
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

class FocusMagicRoll extends TalentRoll {
    constructor(reason = "", max_value = NaN, level = 0, effect = "",
                distance = "", focus = "", duration = "", base_energy_cost = 0,
                black_magic = "", magic_resistance = "", equipment = "", equipment_id = "") {
        super(reason, max_value, level, effect, 0, [], NaN, true, true, distance, focus, duration, base_energy_cost,
            black_magic, magic_resistance, equipment, equipment_id)
        this.energy_investment_validated = !has_any_base_energy() // Cannot invest in energies when using a focus object
        this.margin_dices = []
    }

    formula() {
        return FocusMagicRow.formula
    }

    margin() {
        if (this.margin_dices.length === 0) {
            // Roll needed
            this.roll_dices(1, 3, this.margin_dices)
        }
        return this.margin_dices.reduce((a, b) => {
            return a + b;
        }, 0);
    }

    post_test_margin() {
        return this.is_success() ? super.post_test_margin() : 0;
    }

    critical_value() {
        return 0
    }

    critical_success_text() {
        return ""
    }

    focus_test() {
        return super.margin()
    }

    is_success() {
        return !this.is_critical_failure()
            && (this.focus_test() > 0 || this.focus_test() === 0 && !is_v7 || this.is_critical_success())
    }

    title_formula() {
        let title = "<h4>"
        for (let i = 0; i < FocusMagicRow.formula.length; i++) {
            const symbol = $("#" + FocusMagicRow.formula[i]).parent().find(".input-prefix").get(0)
            if (symbol) {
                title += $(symbol.outerHTML).attr("height", "1em").attr("width", "1em").get(0).outerHTML
                title += "&nbsp;+&nbsp;"
            }
        }
        title += "AM</h4>"
        return title
    }

    format_details(racial_bonus, superpower_bonus) {
        const threshold_name = intermediate_discovery ? "Valeur du test <=" : "Valeur seuil ="
        if (this.energy_investment_validated) {
            return "<div class='row mx-1 align-middle'>Test d'utilisation du focus  = " + this.focus_test()
                + "</div><div class='row mx-1 align-middle'>Somme des 2d6 = " + this.dice_value()
                + this.dice_buttons("base_dices", this.base_dices)
                + "</div><div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + superpower_bonus + this.energy_cost_text() + "</div>"
        } else {
            return "<div class='row mx-1 align-middle'>" + threshold_name
                + "&nbsp;<span id='roll-dialog-threshold'>"
                + this.max_threshold() + "</span>" + racial_bonus + this.energy_cost_text() + "</div>"
        }
    }

    modify_dialog(ignore_sliders) {
        super.modify_dialog(ignore_sliders)
        $(".roll-dialog-magic-hide").addClass("d-none")
        $(".roll-dialog-component-hide").addClass("d-none")
        $(".roll-dialog-focus-hide").addClass("d-none")

        const result = $("#roll-dialog-result")
        if (this.energy_investment_validated && this.is_success()) {
            result.html(this.post_test_margin() + this.dice_buttons("margin_dices", this.margin_dices, 3))
        }
    }
}

class PsiRoll extends TalentRoll {

    energy_cost_text() {
        let text = "</div><div class='row mx-1 align-middle'>Coût du pouvoir (en EP): "
        if (this.energy_investment_validated && this.is_critical_failure()) {
            text += (this.base_energy_cost + this.energy_cost())
                + "</div><div class='row mx-1 align-middle'>Le coût est doublé à cause de l'échec critique"
                + "</div><div class='row mx-1 align-middle'>La perte en plus est à retirer d'abord des EP,"
                + " après des PS et enfin des PVs."
        } else {
            text += this.base_energy_cost
        }
        if (this.energy_cost() > this.base_energy_cost) {
            text += "</div><div class='row mx-1 align-middle'>Coût en énergies: "
                + (this.energy_cost() - this.base_energy_cost)
        }
        return text
    }
}

class GoodNatureEvilMagicRoll extends TalentRoll {
    constructor(reason = "", effect = "", distance = "", focus = "", duration = "",
                base_energy_cost = 0, black_magic = "", magic_resistance = "",
                equipment = "", equipment_id = "") {
        super(reason, NaN, 0, effect, 0, [], NaN, true, true, distance, focus, duration, base_energy_cost,
            black_magic, magic_resistance, equipment, equipment_id)
        this.energy_investment_validated = !has_any_base_energy() // Cannot invest in energies when using a focus object
        this.margin_dices = []
        this.precision_dices = []
        this.type = 3

        this.labels["optional-power"] = "MR + 1d3"
        this.labels["optional-precision"] = "MR + 1d3"
        this.tooltips["optional-power"] = "Puissance investie pour augmenter la marge de 1d3"
        this.tooltips["optional-precision"] = "Précision investie pour augmenter la marge de 1d3"
    }

    max_threshold() {
        return NaN
    }

    margin() {
        if (this.margin_dices.length === 0) {
            // Roll needed
            this.roll_dices(1, 3, this.margin_dices)
        }
        return this.margin_dices.reduce((a, b) => {
            return a + b;
        }, 0) + this.power_value() + this.precision_value() + this.margin_modifier;
    }

    post_test_margin() {
        return this.margin()
    }

    precision_dices_activated() {
        return this.precision_dices.slice(0, this.optional_precision)
    }

    precision_value() {
        if (this.precision_dices.length === 0) {
            // Precision can only be increased up to 3 => roll all the dices directly
            this.roll_dices(3, this.type, this.precision_dices)
        }
        return this.precision_dices_activated().reduce((a, b) => {
            return a + b;
        }, 0);
    }

    is_critical_failure() {
        return false
    }

    is_critical_success() {
        return false
    }

    is_success() {
        return true
    }

    energy_cost_text() {
        let text = "<div class='row mx-1 align-middle'>Coût du sort: "
        if (this.base_energy_cost === 0) {
            text += "1 PS"
        } else {
            text += this.base_energy_cost + " EP (chaque EP est remplaçable par 2 PS)"
        }
        if (this.energy_cost() > this.base_energy_cost) {
            text += "</div><div class='row mx-1 align-middle'>Coût des énergies: "
                + (this.energy_cost() - this.base_energy_cost)
        }
        return text + "</div>"
    }

    format_details(racial_bonus, superpower_bonus) {
        return this.energy_cost_text()
    }

    details_text() {
        const data = super.details_text()
        let effect_text = data[1]
        if (this.energy_investment_validated) {
            if (this.is_success() && this.optional_precision > 0 && this.precision_value() >= 0) {
                effect_text = "<div class='row mx-1 align-middle'>" + this.optional_precision
                    + "d" + this.type + " de précision rajoutés = "
                    + this.precision_value()
                    + this.dice_buttons("precision_dices", this.precision_dices_activated(), this.type)
                    + "</div>" + effect_text
            }
        }
        return [data[0], effect_text]
    }

    modify_dialog(ignore_sliders) {
        super.modify_dialog(ignore_sliders)
        $(".roll-dialog-component-hide").addClass("d-none")
        $(".roll-dialog-base-energy-hide").addClass("d-none")

        const result = $("#roll-dialog-result")
        if (this.energy_investment_validated && this.is_success()) {
            result.html(this.post_test_margin() + this.dice_buttons("margin_dices", this.margin_dices, 3))
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
    if (!current_roll || !(current_roll instanceof TalentRoll) || isNaN(modifier))
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
        current_roll.show_roll(true)
        timed_update_roll_trigger()
    }
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

$("#roll-1d6").on("click", _ => {
    // Reset invested energies
    $(".roll-dialog-energy").val(0)
    $(".roll-dialog-component").each((i, elem) => uncheck_checkbox(elem))
    // Trigger roll
    new Roll(1).trigger_roll()
    $('#roll-dialog').modal()
})

$("#roll-2d6").on("click", _ => {
    // Reset invested energies
    $(".roll-dialog-energy").val(0)
    $(".roll-dialog-component").each((i, elem) => uncheck_checkbox(elem))
    // Trigger roll
    new Roll().trigger_roll()
    $('#roll-dialog').modal()
})

$("#roll-free").on("click", _ => {
    // Reset invested energies
    $(".roll-dialog-energy").val(0)
    $(".roll-dialog-component").each((i, elem) => uncheck_checkbox(elem))
    // Trigger roll
    const number = parseInt($("#roll-free-number").val())
    if (!isNaN(number)) {
        new Roll(number).trigger_roll()
        $('#roll-dialog').modal()
    }
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
    if (!current_roll || !(current_roll instanceof TalentRoll))
        return
    // Trigger the same roll but with the correct precision
    current_roll.update_energies(true)
    $(e.target).parent().tooltip("dispose")
    current_roll.show_roll()
})

$(".roll-dialog-component").on("click", _ => {
    if (!current_roll || !(current_roll instanceof TalentRoll))
        return
    current_roll.update_components(true)
    current_roll.show_roll()
})

$("#roll-dialog-expended-charges").on("change", e => {
    const current_value = parseInt($(e.target).val())
    if (isNaN(current_value) || current_value <= 1) {
        $("#roll-dialog-unit-equipment-plural").text("")
    } else {
        $("#roll-dialog-unit-equipment-plural").text("s")
    }
})

$("#roll-dialog-validate-equipment").on("click", _ => {
    if (!current_roll || !(current_roll instanceof TalentRoll))
        return
    current_roll.expended_charge = parseInt($("#roll-dialog-expended-charges").val())

    // Update count
    const equipment = $("#" + current_roll.equipment_id)
    if (equipment.length > 0 && !isNaN(current_roll.expended_charge)) {
        row_of(equipment).expend_charges(current_roll.expended_charge)
    }

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

$("#roll-dialog-redo").on("click", _ => {
    if (!current_roll)
        return
    current_roll.reroll()
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
