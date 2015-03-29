$(document).ready(function() {

    // Performs the background check of the password
    $('#check-btn').on('click', function() {

        const pw = $('#confirm-input').val();
        const url = $('#confirm-form').attr('action').replace(/^\/\w+\//, '/check/');

        $.post(url, { password: pw }, function(result) {

            var panelColor = 'panel-success';
            var textColor = 'text-success';
            var msg = 'Correct!';

            if (result) {
                panelColor = 'panel-danger';
                textColor = 'text-danger';
                msg = result;
            }

            // Alters the confirm panel
            $('#confirm-panel').removeClass(function(index, css) {
                return (css.match(/panel-\w+/g) || []).join(' ');
            }).addClass(panelColor);

            // Alters the message in the confirm panel
            $('#confirm-msg-p').removeClass('hidden').children('strong').removeClass(function(index, css) {
                return (css.match(/text-\w+/g) || []).join(' ');
            }).addClass(textColor).html(msg);
        })
    });
});