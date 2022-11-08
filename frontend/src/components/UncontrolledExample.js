import Carousel from 'react-bootstrap/Carousel';

function UncontrolledExample() {
  return (
    <div className="d-flex">
      <div className="col-8 mx-1">
        <Carousel>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={'/image/slide1.jpg'}
              alt="First slide"
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={'/image/slide2.jpg'}
              alt="Second slide"
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={'/image/slide3.jpg'}
              alt="Third slide"
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={'/image/slide4.jpg'}
              alt="Third slide"
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={'/image/slide5.jpg'}
              alt="Third slide"
            />
          </Carousel.Item>
        </Carousel>
      </div>
      <div className="col-4">
        <div>
          <img
            className="d-block w-100 mb-1"
            src={'/image/slide2.jpg'}
            alt="Second slide"
          />
        </div>
        <div>
          <img
            className="d-block w-100"
            src={'/image/slide5.jpg'}
            alt="Second slide"
          />
        </div>
      </div>
    </div>
  );
}

export default UncontrolledExample;
