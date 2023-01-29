import React, { useReducer, useEffect, useRef, useState } from "react";
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import logger from 'use-reducer-logger';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Product from '../components/Product';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import News from '../components/News';
import UncontrolledExample from '../components/UncontrolledExample';
import Button from 'react-bootstrap/Button';
import socketIOClient from "socket.io-client";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";
import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return { ...state, products: action.payload, loading: false };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
const ENDPOINT =
  window.location.host.indexOf("localhost") >= 0
    ? "http://127.0.0.1:4000"
    : window.location.host;
function HoneScreen() {
  const uiMessagesRef = useRef(null);

  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState([
    { from: "System", body: "Hello there, Please ask your question." },
  ]);

  const [socket, setSocket] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [{ loading, error, products }, dispatch] = useReducer(logger(reducer), {
    products: [],
    loading: true,
    error: '',
  });
  // const [products, setProducts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_REQUEST' });
      try {
        const result = await axios.get('/api/products');
        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
      } catch (err) {
        dispatch({ type: 'FETCH_FAIL', payload: err.message });
      }
      // setProducts(result.data);
    };
    if (uiMessagesRef.current) {
      uiMessagesRef.current.scrollBy({
        top: uiMessagesRef.current.scrollHeight,
        left: 0,
        behavior: "smooth",
      });
    }
    if (socket) {
      socket.emit("onLogin", { name: userName });
      socket.on("message", (data) => {
        setMessages([...messages, data]);
      });
    }
    fetchData();
  }, [messages, socket, userName]);
  const supportHandler = () => {
    setIsOpen(true);
    if (!userName) {
      setUserName(prompt("Please enter your name"));
    }
    const sk = socketIOClient(ENDPOINT);
    setSocket(sk);
  };
  const closeHandler = () => {
    setIsOpen(false);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!messageBody.trim()) {
      alert("Error. Please type message.");
    } else {
      setMessages([
        ...messages,
        { body: messageBody, from: userName, to: "Admin" },
      ]);
      setTimeout(() => {
        socket.emit("onMessage", {
          body: messageBody,
          from: userName,
          to: "Admin",
        });
      }, 1000);
      setMessageBody("");
    }
  };
  return (
    <div>
      <Helmet>
        <title>HUONGTX</title>
      </Helmet>
      <UncontrolledExample />
      <div className="chatbox chat-button">
        {!isOpen ? (
          <Button onClick={supportHandler} variant="primary" className="chat">
            Chat with us
          </Button>
        ) : (
          <Card>
            <Card.Body>
              <Row>
                <Col>
                  <strong>Support</strong>
                </Col>
                <Col className="text-end">
                  <Button
                    className="btn-sm btn-secondary"
                    type="button"
                    onClick={closeHandler}
                  >
                    x
                  </Button>
                </Col>
              </Row>
              <hr />
              <ListGroup className="ui-messages" ref={uiMessagesRef}>
                {messages.map((msg, index) => (
                  <ListGroup.Item key={index} className="group-messenge">
                    <Avatar className={msg.from === "Admin" ? "messenge-admin" : "messenge-user"} icon={<UserOutlined />} /><strong>{`${msg.from} `}</strong> 
                    <div className={msg.from === "Admin" || msg.from === "System" ? "list-mess" : "list-mess mess-active"}>{msg.body}</div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <form onSubmit={submitHandler}>
                <InputGroup className="col-6">
                  <FormControl
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    type="text"
                    placeholder="type message"
                  ></FormControl>
                  <Button type="submit" variant="primary">
                    Send
                  </Button>
                </InputGroup>
              </form>
            </Card.Body>
          </Card>
        )}
      </div>
      <h1 className="text-center border my-4 py-2 text-header">
        Feature Products
      </h1>
      <div className="products">
        {loading ? (
          <LoadingBox />
        ) : error ? (
          <MessageBox variant="danger">{error}</MessageBox>
        ) : (
          <Row>
            {products.map((product) => (
              <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                <Product product={product}></Product>
              </Col>
            ))}
          </Row>
        )}
        <div className="justify-content-between d-flex">
          <div></div>
          {/* <div class="mt-5">
            <Buttom />
          </div> */}
          <div></div>
        </div>
        <div className="pb-5">
          <h1 className="text-center border my-4 py-2 text-header">News</h1>
          <div>
            <News />
          </div>
        </div>
      </div>
    </div>
  );
}
export default HoneScreen;
