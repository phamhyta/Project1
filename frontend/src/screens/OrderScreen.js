import axios from 'axios';
import React, {
  useContext,
  useEffect,
  useReducer,
  useState,
  useRef,
} from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store';
import { getError } from '../utils';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, order: action.payload, loading: false, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'PAY_REQUEST':
      return { ...state, loadingPay: true };
    case 'PAY_SUCCESS':
      return { ...state, loadingPay: false, successPay: true };
    case 'PAY_FAIL':
      return { ...state, loadingPay: false };
    case 'PAY_RESET':
      return { ...state, loadingPay: false, successPay: false };
    case 'DELIVER_REQUEST':
      return { ...state, loadingDeliver: true };
    case 'DELIVER_SUCCESS':
      return { ...state, loadingDeliver: false, successDeliver: true };
    case 'DELIVER_FAIL':
      return { ...state, loadingDeliver: false };
    case 'DELIVER_RESET':
      return {
        ...state,
        loadingDeliver: false,
        successDeliver: false,
      };
    default:
      return state;
  }
};

const OrderScreen = () => {
  let reviewsRef = useRef();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [rating, setRating] = useState(0);
  const [idProduct, setIdProduct] = useState(0);
  const [comment, setComment] = useState('');
  const params = useParams();
  const { id: orderId } = params;
  const navigate = useNavigate();
  const [
    {
      loading,
      error,
      order,
      successPay,
      loadingPay,
      loadingDeliver,
      successDeliver,
      product,
      loadingCreateReview,
    },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    order: {},
    error: '',
    product: [],
    successPay: false,
    loadingPay: false,
  });

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  function createOrder(data, actions) {
    return actions.order
      .create({
        purchase_units: [
          {
            amount: { value: order.totalPrice },
          },
        ],
      })
      .then((orderId) => {
        return orderId;
      });
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(async function (details) {
      try {
        dispatch({ type: 'PAY_REQUEST' });
        const { data } = await axios.put(
          `/api/orders/${order._id}/pay`,
          details,
          {
            headers: { authorization: `Bearer ${userInfo.token}` },
          }
        );
        dispatch({ type: 'PAY_SUCCESS', payload: data });
        toast.success('Order is paid');
      } catch (err) {
        dispatch({ type: 'PAY_FAIL', payload: getError(err) });
        toast.error(getError(err));
      }
    });
  }
  function onError(err) {
    toast.error(getError(err));
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!comment || !rating) {
      toast.error('Please enter comment and rating');
      return;
    }
    try {
      const { data } = await axios.post(
        `/api/products/${idProduct}/reviews`,
        { rating, comment, name: userInfo.name },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );

      dispatch({
        type: 'CREATE_SUCCESS',
      });
      toast.success('Review submitted successfully');
      // product.reviews.unshift(data.review);
      product.numReviews = data.numReviews;
      product.rating = data.rating;
      dispatch({ type: 'REFRESH_PRODUCT', payload: product });
      window.scrollTo({
        behavior: 'smooth',
        // top: reviewsRef.current.offsetTop,
      });
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: 'CREATE_FAIL' });
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
      }
    };
    if (!userInfo) {
      return navigate('/login');
    }
    if (
      !order._id ||
      successPay ||
      successDeliver ||
      (order._id && order._id !== orderId)
    ) {
      fetchOrder();
      if (successPay) {
        dispatch({ type: 'PAY_RESET' });
      }
      if (successDeliver) {
        dispatch({ type: 'DELIVER_RESET' });
      }
    } else {
      const loadPaypalScript = async () => {
        const { data: clientId } = await axios.get('/api/keys/paypal', {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        paypalDispatch({
          type: 'resetOptions',
          value: {
            'client-id': clientId,
            currency: 'USD',
          },
        });
        paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
      };
      loadPaypalScript();
    }
  }, [
    order,
    userInfo,
    orderId,
    navigate,
    paypalDispatch,
    successPay,
    successDeliver,
  ]);

  async function deliverOrderHandler() {
    try {
      dispatch({ type: 'DELIVER_REQUEST' });
      const { data } = await axios.put(
        `/api/orders/${order._id}/deliver`,
        {},
        {
          headers: { authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: 'DELIVER_SUCCESS', payload: data });
      toast.success('Order is delivered');
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: 'DELIVER_FAIL' });
    }
  }

  return loading ? (
    <LoadingBox></LoadingBox>
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <div>
      <Helmet>
        <title>Order {orderId}</title>
      </Helmet>
      <h1 className="my-3">Order {orderId}</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Shipping</Card.Title>
              <Card.Text>
                <strong>Name:</strong> {order.shippingAddress.fulName}
                <br />
                <strong>Address:</strong> {order.shippingAddress.address},
                {order.shippingAddress.city},{order.shippingAddress.postalCode},
                {order.shippingAddress.country}
                &nbsp;
                {order.shippingAddress.location &&
                  order.shippingAddress.location.lat && (
                    <a
                      target="_new"
                      href={`https://maps.google.com?q=${order.shippingAddress.location.lat},${order.shippingAddress.location.lng}`}
                    >
                      Show On Map
                    </a>
                  )}
              </Card.Text>
              {order.isDelivered ? (
                <MessageBox variant="success">
                  Delivered at {order.deliveredAt}
                </MessageBox>
              ) : (
                <MessageBox variant="danger">Not Delivered</MessageBox>
              )}
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Payment</Card.Title>
              <Card.Text>
                <strong>Method:</strong> {order.paymentMethod}
              </Card.Text>
              {order.isPaid ? (
                <MessageBox variant="success">
                  Paid at {order.paidAt}
                </MessageBox>
              ) : (
                <MessageBox variant="danger">Not Paid</MessageBox>
              )}
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Items</Card.Title>
              <ListGroup variant="flush">
                {order.orderItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col sm={6}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rouned img-thumbnail"
                        ></img>
                        {''}
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col sm={3}>
                        <span>{item.quantity}</span>{' '}
                      </Col>
                      <Col sm={3}>${item.price}</Col>
                    </Row>
                    {order.isDelivered && (
                      <div className="my-3">
                        {userInfo ? (
                          <form onSubmit={submitHandler}>
                            <h2>Write a customer review</h2>
                            <Form.Group className="mb-3" controlId="rating">
                              <Form.Label>Rating</Form.Label>
                              <Form.Select
                                aria-label="Rating"
                                value={rating}
                                onChange={(e) => setRating(e.target.value)}
                              >
                                <option value="">Select...</option>
                                <option value="1">1- Poor</option>
                                <option value="2">2- Fair</option>
                                <option value="3">3- Good</option>
                                <option value="4">4- Very good</option>
                                <option value="5">5- Excelent</option>
                              </Form.Select>
                            </Form.Group>
                            <FloatingLabel
                              controlId="floatingTextarea"
                              label="Comments"
                              className="mb-3"
                            >
                              <Form.Control
                                as="textarea"
                                placeholder="Leave a comment here"
                                value={comment}
                                onChange={(e) => {
                                  setComment(e.target.value);
                                  setIdProduct(item._id);
                                }}
                              />
                            </FloatingLabel>

                            <div className="mb-3">
                              <Button
                                disabled={loadingCreateReview}
                                type="submit"
                              >
                                Submit
                              </Button>
                              {loadingCreateReview && <LoadingBox></LoadingBox>}
                            </div>
                          </form>
                        ) : (
                          <MessageBox>
                            Please{' '}
                            <Link
                              to={`/signin?redirect=/product/${product.slug}`}
                            >
                              Sign In
                            </Link>{' '}
                            to write a review
                          </MessageBox>
                        )}
                        <Link variant="light" to={`/product/${item.slug}`}>
                          Show all comment
                        </Link>
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card.Body>
            <Card.Title>Order Summary</Card.Title>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>${order.itemsPrice.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${order.shippingPrice.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>${order.taxPrice.toFixed(2)}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>
                    <strong>Order Total</strong>
                  </Col>
                  <Col>
                    <strong>${order.totalPrice.toFixed(2)}</strong>
                  </Col>
                </Row>
              </ListGroup.Item>
              {!order.isPaid && (
                <ListGroup.Item>
                  {isPending ? (
                    <LoadingBox />
                  ) : (
                    <div>
                      <PayPalButtons
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                      ></PayPalButtons>
                    </div>
                  )}
                  {loadingPay && <LoadingBox></LoadingBox>}
                </ListGroup.Item>
              )}
              {userInfo.isAdmin && order.isPaid && !order.isDelivered && (
                <ListGroup.Item>
                  {loadingDeliver && <LoadingBox></LoadingBox>}
                  <div className="d-grid">
                    <Button type="button" onClick={deliverOrderHandler}>
                      Deliver Order
                    </Button>
                  </div>
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card.Body>
        </Col>
      </Row>
    </div>
  );
};

export default OrderScreen;
