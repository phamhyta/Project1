import { useContext, useState } from 'react';
import { Store } from '../Store';
import { Helmet } from 'react-helmet-async';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MessageBox from '../components/MessageBox';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import { Link, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { cartItems },
  } = state;
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const updateCartHandler = async (item, quantity) => {
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert('Sorry. Product is out of stock');
      return;
    }
    ctxDispatch({
      type: 'CART_ADD_ITEM',
      payload: { ...item, quantity },
    });
  };
  const removeItemHandler = (item) => {
    ctxDispatch({
      type: 'CART_REMOVE_ITEM',
      payload: item,
    });
    handleClose();
  };

  const checkoutHandler = () => {
    navigate('/signin?redirect=/shipping');
  };
  return (
    <div>
      <Helmet>
        <title>Shopping cart</title>
      </Helmet>
      <h1>Shopping cart</h1>
      <Row>
        <Col md={8}>
          {cartItems.length === 0 ? (
            <MessageBox>
              Cart is empty. <Link to="/">Go shopping</Link>
            </MessageBox>
          ) : (
            <ListGroup>
              {cartItems.map((item) => (
                <ListGroup.Item key={item._id}>
                  <Row className="align-items-center">
                    <Col md={4}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="img-fluid rouned img-thumbnail"
                      ></img>
                      {''}
                      <Link to={`/product/${item.slug}`}>{item.name}</Link>
                    </Col>
                    <Col md={3}>
                      <Button
                        variant="light"
                        onClick={() =>
                          updateCartHandler(item, item.quantity - 1)
                        }
                        disabled={item.quantity === 1}
                      >
                        <i className="fas fa-minus-circle"></i>
                      </Button>
                      <span>{item.quantity}</span>{' '}
                      <Button
                        variant="light"
                        onClick={() =>
                          updateCartHandler(item, item.quantity + 1)
                        }
                        disabled={item.quantity === item.countInStock}
                      >
                        <i className="fas fa-plus-circle"></i>
                      </Button>
                    </Col>
                    <Col md={3}>${item.price}</Col>
                    <Col md={2}>
                      <Button variant="light" onClick={handleShow}>
                        Delete
                      </Button>
                      <Modal show={show} onHide={handleClose}>
                        <Modal.Header closeButton>
                          <Modal.Title>Delete product</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          Are you sure you want to remove this product from your
                          cart?
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={handleClose}>
                            Close
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => removeItemHandler(item)}
                          >
                            Delete
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body>
              <ListGroup.Item variant="flush">
                <h3>
                  Subtotal ({cartItems.reduce((a, c) => a + c.quantity, 0)}{' '}
                  items): $
                  {cartItems.reduce((a, c) => a + c.quantity * c.price, 0)}
                </h3>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-gird">
                  <Button
                    type="buttom"
                    variant="primary"
                    onClick={checkoutHandler}
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </ListGroup.Item>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
