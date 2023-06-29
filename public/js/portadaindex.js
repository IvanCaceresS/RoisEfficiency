function App() {}

window.onload = function (event) {
    var app = new App();
    window.app = app;
    app.startCarousel();
};

App.prototype.processingButton = function(event) {
    const btn = event.currentTarget;
    const slickList = event.currentTarget.parentNode;
    const track = event.currentTarget.parentNode.querySelector('#track');
    const slick = track.querySelectorAll('.slick');

    const slickWidth = slick[0].offsetWidth;
    
    const trackWidth = track.offsetWidth;
    const listWidth = slickList.offsetWidth;

    track.style.left == ""  ? leftPosition = track.style.left = 0 : leftPosition = parseFloat(track.style.left.slice(0, -2) * -1);

    btn.dataset.button == "button-prev" ? prevAction(leftPosition,slickWidth,track) : nextAction(leftPosition,trackWidth,listWidth,slickWidth,track)
}

let prevAction = (leftPosition,slickWidth,track) => {
    if(leftPosition > 0) {
        console.log("entro 2")
        track.style.left = `${-1 * (leftPosition - slickWidth)}px`;
    }else{
        track.style.left = '0px';
    }
}

let nextAction = (leftPosition,trackWidth,listWidth,slickWidth,track) => {
    if(leftPosition < (trackWidth - listWidth)) {
        track.style.left = `${-1 * (leftPosition + slickWidth)}px`;
    }
}

App.prototype.startCarousel = function() {
    setInterval(function() {
        const nextButton = document.querySelector('[data-button="button-next"]');
        const track = document.querySelector('#track');
        const slickWidth = track.querySelector('.slick').offsetWidth;
        const trackWidth = track.offsetWidth;
        const listWidth = document.querySelector('.slick-list').offsetWidth;
        const leftPosition = parseFloat(track.style.left.slice(0, -2) * -1);
        
        
        if (leftPosition >= (trackWidth - listWidth)) {
            track.style.left = '0px'; // Vuelve al inicio del carrusel
        } else {
            nextButton.click(); // Cambia a la siguiente imagen
        }
    }, 3000); // Cambia el valor 3000 por el tiempo en milisegundos entre cada cambio de imagen
};

