// Initialize Yii object if not exists
if (typeof Yii == 'undefined') var Yii = {};

// Setup data structure
Yii.translate = {
    dictionary:{},
    config:{language:''}
};

/**
 * Process translations
 *
 * @param message the message to be translated
 * @param params array of parameters (number, placeholders)
 * @param dictionary instance of dictionary
 * @return translated string
 */
Yii.translate.do = function (message, params, dictionary) {

    // try to translate string
    var translation = (dictionary && typeof dictionary[message] !== 'undefined') ? dictionary[message] : message;

    // handle plural forms (choice format. e.g.: Yii::t('app', 'n==1#one book|n>1#many books', 1));
    var num = false;

    if (typeof params !== 'undefined') {
        // extract number from params
        if (typeof params == 'number')  num = params; // params is a number
        if (typeof params.n == 'number') num = params.n; // else check if key 'n' exists

        // remove from params if exists (treat all other params as placeholders)
        delete params.n;
    }

    // split translation into pieces
    var chunks = translation.split('|');
    if (translation.indexOf('#') !== -1) { // translation contains expression
        for (var i = 0; i < chunks.length; i++) {
            var pieces = chunks[i].split('#'), // split each chunk in two parts (0: expression, 1: message)
                ex = pieces[0],
                msg = pieces[1];

            if (pieces.length == 2) {
                // handle number shortcut (0 instead of n==0)
                if (ex % 1 === 0) ex = 'n==' + ex;

                // create expression to be evaluated (e.g. n>3)
                var eval_expr = ex.split('n').join(num);

                // if expression matches, set translation to current chunk
                if (eval(eval_expr)) {
                    translation = msg;
                    break;
                }
            }
        }
    }
    // if translation doesn't contain # but does contain |, treat it as simple choice format
    else if (chunks.length > 1) translation = (num == 1) ? chunks[0] : chunks[1];

    // replace {n} with number
    if (typeof num == 'number') translation = translation.split('{n}').join(num);

    // replace placeholder/replacements
    if (typeof(params == 'Object')) for (var key in params) translation = translation.split('{'+key+'}').join(params[key]);

    return translation;
}

/**
 * Shortcut function to translate
 * This fetches the right dictionary (language/category) and passes it to the actual translate function
 *
 * @param category of the translation
 * @param message the message to be translated
 * @param params array of parameters (number, placeholders)
 * @param params language code to translate to (will use fallback if not supplied)
 */
Yii.t = function (category, message, params, language) {
    // use supplied language, if not defined, fall back on config
    var lang = language ? language : Yii.translate.config.language;

    var dictionary = false;

    //  language not found, return original message
    if (typeof Yii.translate.dictionary[lang] !== 'undefined')
        if (category && typeof Yii.translate.dictionary[lang][category] !== 'undefined')
            dictionary = Yii.translate.dictionary[lang][category];

    // pass message and dictionary to translate function
    return Yii.translate.do(message, params, dictionary);
}