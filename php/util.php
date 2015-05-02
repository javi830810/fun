<?php

function PaintRectangle($width, $height){
	$total_height = $height+ 20;
	$total_width = $width+ 30;

	print "<div class='ad-border' style='height:".$total_height."px;width:".$total_width."px'>";
	print "<div class='ad-width'>".$width."</div>";
	print "<div class='ad-height'><div class='inner-height'>".$height."</div></div>";
	print "<div class='ad-content' style='height:".$height."px;width:".$width."px'>content</div>";
	
	
	print "</div>";
}

?>