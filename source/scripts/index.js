(function ($, _, preview) {

/*
 |---------------------------------------------------------------------------------
 |	PREVIEW INDEX PAGE
 |---------------------------------------------------------------------------------
 |
 |
 |
*/
preview.Index = _.extend({

//---------------------------------------------------------------------------------
//		Members
//---------------------------------------------------------------------------------

 		initialize : function () {
 			var $htmlbody   = $('html, body');
 			var $window     = $(window);
 			var $sequence = $('.main');


 			preview.Sequencer.initialize();

			$htmlbody.height(window.preview_data.FULL_PAGE_HEIGHT);

			setTimeout(function(){
					console.log("Showing the pictures!!!");

					var $loading = $('.loading');
					var $floating = $('.floating');
					//$loading.addClass('hideme');

					$floating.removeClass('hideme');
				},2000);


 		},

 	}, preview.Object);


//---------------------------------------------------------------------------------
//		Wait for dom to initialize
//---------------------------------------------------------------------------------

	$ && $(window).on('load', function () {

		console.log('Initializing Index page');

		preview.Index.initialize();

	});


}(window.jQuery, window._, window.preview));
