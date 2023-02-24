import React, { useContext, useEffect, useReducer } from 'react';
import Chart from 'react-google-charts';
import axios from 'axios';
import { Store } from '../Store';
import { getError } from '../utils';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { ReactComponent as Balloon } from '../assets/svg/balloon.svg';
import { ReactComponent as Leaves } from '../assets/svg/leaves.svg';
import { ReactComponent as Square } from '../assets/svg/square.svg';
import { ReactComponent as Frame } from '../assets/svg/frame.svg';
const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        summary: action.payload,
        loading: false,
      };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const dataChart = [
  ['Country', 'Popularity'],
  ['Germany', 200],
  ['United States', 300],
  ['Brazil', 400],
  ['Canada', 500],
  ['France', 600],
  ['RU', 700],
];

export const optionsChart = {
  title: 'Daily Products',
  vAxis: { title: 'Product' },
  hAxis: { title: 'Day' },
  seriesType: 'bars',
  series: { 5: { type: 'line' } },
};
export default function DashboardScreen() {
  const [{ loading, summary, error }, dispatch] = useReducer(reducer, {
    loading: true,
    error: '',
  });
  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get('/api/orders/summary', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (err) {
        dispatch({
          type: 'FETCH_FAIL',
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [userInfo]);

  return (
    <div className="dashboard">
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <div className="font-bold text-2xl pt-8 pl-8">Dashboard</div>
          <div className="w-11/12 flex first-content m-8">
            <div className="w-1/4 justify-center flex items-center">
              <div className="z-20">
                <div className="font-medium text-2xl color-green">
                  Hello Marry{' '}
                </div>
                <div className="font-light text-sm">
                  Have a nice day to work!
                </div>
              </div>
            </div>
            <div className="w-1/4 bg-white my-6 flex rounded-md mr-6">
              <div className="w-1/3 mt-4">
                <Leaves className="absolute mt-6 ml-3" />
                <Balloon />
              </div>
              <div className="w-1/2 py-3">
                <div className="font-normal">Users</div>
                <div className="font-bold text-xl">
                  {summary.users && summary.users[0]
                    ? summary.users[0].numUsers
                    : 0}
                </div>
              </div>
            </div>
            <div className="w-1/4 bg-white my-6 flex rounded-md mr-6">
              <div className="w-1/3 mt-4">
                <Square className="absolute mt-6 ml-3" />
                <Balloon />
              </div>
              <div className="w-1/2 py-3">
                <div className="font-normal">Orders</div>
                <div className="font-bold text-xl">
                  {summary.orders && summary.users[0]
                    ? summary.orders[0].numOrders
                    : 0}
                </div>
              </div>
            </div>
            <div className="w-1/4 bg-white my-6 flex rounded-md mr-6">
              <div className="w-1/3 mt-4">
                <Frame className="absolute mt-6 ml-3" />
                <Balloon />
              </div>
              <div className="w-1/2 py-3">
                <div className="font-normal">Orders</div>
                <div className="font-bold text-xl">
                  $
                  {summary.orders && summary.users[0]
                    ? summary.orders[0].totalSales.toFixed(2)
                    : 0}
                </div>
              </div>
            </div>
          </div>
          <div className="chart">
            <div className="my-3 chart-left">
              {/* <h2 className="font-bold text-2xl pt-8 pl-8">Sales</h2> */}
              {summary.dailyOrders.length === 0 ? (
                <MessageBox>No Sale</MessageBox>
              ) : (
                <Chart
                  options={{
                    title: 'Sales',
                    vAxis: { title: 'Sale' },
                    hAxis: { title: 'Day' },
                  }}
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ['Date', 'Sales'],
                    ...summary.dailyOrders.map((x) => [x._id, x.sales]),
                  ]}
                ></Chart>
              )}
            </div>
            <div className="my-3 chart-right">
              {/* <h2 className="font-bold text-2xl pt-8 pl-8">Categories</h2> */}
              {summary.productCategories.length === 0 ? (
                <MessageBox>No Category</MessageBox>
              ) : (
                <Chart
                  options={{
                    title: 'Categories',
                  }}
                  width="100%"
                  height="400px"
                  chartType="PieChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ['Category', 'Products'],
                    ...summary.productCategories.map((x) => [x._id, x.count]),
                  ]}
                ></Chart>
              )}
            </div>
          </div>
          <div className="mt-5">
            <Chart
              chartType="ComboChart"
              width="100%"
              height="400px"
              data={[
                ['Day', ...summary.productCategories.map((x) => x._id)],
                ...summary.dailyOrders.map((x) => [
                  x._id,
                  ...summary.productCategories.map((x) => x.count),
                ]),
              ]}
              options={optionsChart}
            />
          </div>
          <div className="my-5 py-5">
            <Chart
              chartEvents={[
                {
                  eventName: 'select',
                  callback: ({ chartWrapper }) => {
                    const chart = chartWrapper.getChart();
                    const selection = chart.getSelection();
                    if (selection.length === 0) return;
                    const region = dataChart[selection[0].row + 1];
                    console.log('Selected : ' + region);
                  },
                },
              ]}
              chartType="GeoChart"
              width="100%"
              height="400px"
              data={dataChart}
            />
          </div>
        </>
      )}
    </div>
  );
}
