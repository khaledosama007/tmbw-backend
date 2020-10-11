

$('nav ul a').click(function(){

   let selectdId = $(this).attr('href');

   let finalSelected = selectdId + '-s';

   let selectedOffsettop = $(finalSelected).offset().top;

   $( "html , body" ).animate({ scrollTop : selectedOffsettop -100  } , 2000 )
})

$('#control').click(function(){

    let homenavtop = $('#homeAndNav-s').offset().top;

    $( "html , body" ).animate({ scrollTop :homenavtop  } , 2000 )

})


// media query event handler
if (matchMedia) {
  const mq = window.matchMedia("(max-width: 750px)");
  mq.addListener(WidthChange);
  WidthChange(mq);
}

// media query change
function WidthChange(mq) {

  if (mq.matches) {
    
    // window width is at least 500px
    $('#homenav-s ul li').click(function(){
    $('#check').prop('checked', false);      
    })
  } 

}

// var mq = window.matchMedia( "(max-width: 750px)" );

// if (mq.matches) {

//   console.log('anaaaaa') 

// }
// else {
//   console.log('meeeeee')
// }

// const media = matchMedia('(max-width: 750px)')

// media.addEventListener("change", init)

// function init(){

//       document.querySelector('#homenav-s ul li').onclick(function(){

//         console.log('anaaaaa') })
//       }
     //   $('#homenav-s ul').css("background-color" , "red")

          //  $('#homenav-s ul').css("left" , "-100%")
