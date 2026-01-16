// src/App.jsx - V7.2.0 (全量铁律版：包含纵向列表、340城市、坐标锁死、必填校验)
import React, { useState, useCallback, useMemo } from 'react';
import { Layout, Form, Input, Button, Card, Row, Col, message, Tag, Divider, Switch, InputNumber, Select, AutoComplete, Checkbox } from 'antd';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Radar as RechartsRadar } from 'recharts';
import axios from 'axios';
import { CarOutlined, AimOutlined, EnvironmentOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Option } = Select;

function nativeDebounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const SUBWAY_CITIES = ['北京', '上海', '广州', '深圳', '南京', '武汉', '重庆', '成都', '西安', '苏州', '杭州', '郑州', '沈阳', '大连', '长春', '哈尔滨', '天津', '昆明', '南宁', '长沙', '宁波', '无锡', '青岛', '合肥', '福州', '东莞', '石家庄', '南昌', '厦门', '贵阳', '乌鲁木齐', '济南', '兰州', '常州', '徐州', '呼和浩特', '佛山', '太原', '洛阳', '绍兴', '南通', '芜湖', '温州', '台州', '嘉兴', '金华', '红河', '天水', '三亚', '黄石', '文山', '凤凰'];

// 铁律：绝对禁止裁剪数据，保留 340 个地级市
const ALL_CITIES = ['北京','上海','天津','重庆','石家庄','唐山','秦皇岛','邯郸','邢台','保定','张家口','承德','沧州','廊坊','衡水','太原','大同','阳泉','长治','晋城','朔州','晋中','运城','忻州','临汾','吕梁','呼和浩特','包头','乌海','赤峰','通辽','鄂尔多斯','呼伦贝尔','巴彦淖尔','乌兰察布','兴安','锡林郭勒','阿拉善','沈阳','大连','鞍山','抚顺','本溪','丹东','锦州','营口','阜新','辽阳','盘锦','铁岭','朝阳','葫芦岛','长春','吉林','四平','辽源','通化','白山','松原','白城','延边','哈尔滨','齐齐哈尔','鸡西','鹤岗','双鸭山','大庆','伊春','佳木斯','七台河','牡丹江','黑河','绥化','大兴安岭','南京','无锡','徐州','常州','苏州','南通','连云港','淮安','盐城','扬州','镇江','泰州','宿迁','杭州','宁波','温州','嘉兴','湖州','绍兴','金华','衢州','舟山','台州','丽水','合肥','芜湖','蚌埠','淮南','马鞍山','淮北','铜陵','安庆','黄山','滁州','阜阳','宿州','六安','亳州','池州','宣城','福州','厦门','莆田','三明','泉州','漳州','南平','龙岩','宁德','南昌','景德镇','萍乡','九江','新余','鹰潭','赣州','吉安','宜春','抚州','上饶','济南','青岛','淄博','枣庄','东营','烟台','潍坊','济宁','泰安','威海','日照','临沂','德州','聊城','滨州','菏泽','郑州','开封','洛阳','平顶山','安阳','鹤壁','新乡','焦作','濮阳','许昌','漯河','三门峡','南阳','商丘','信阳','周口','驻麻店','济源','武汉','黄石','十堰','宜昌','襄阳','鄂州','荆门','孝感','荆州','黄冈','咸宁','随州','恩施','仙桃','潜江','天门','神农架','长沙','株洲','湘潭','衡阳','邵阳','岳阳','常德','张家界','益阳','郴州','永州','怀化','娄底','湘西','广州','韶关','深圳','珠海','汕头','佛山','江门','湛江','茂名','肇庆','惠州','梅州','汕尾','河源','阳江','清远','东莞','中山','潮州','揭阳','云浮','南宁','柳州','桂林','梧州','北海','防城港','钦州','贵港','玉林','百色','贺州','河池','来宾','崇左','海口','三亚','三沙','儋州','五指山','琼海','文昌','万宁','东方','定安','屯昌','澄迈','临高','白沙','昌江','乐东','陵水','保亭','琼中','成都','自贡','攀枝花','泸州','德阳','绵阳','广元','遂宁','内江','乐山','南充','眉山','宜宾','广安','达州','雅安','巴中','资阳','阿坝','甘孜','凉山','贵阳','六盘水','遵义','安顺','毕节','铜仁','黔西南','黔东南','黔南','曲靖','玉溪','保山','昭通','丽江','普洱','临沧','楚雄','西双版纳','大理','德宏','怒江','迪庆','拉萨','日喀则','昌都','林芝','山南','那曲','阿里','西安','铜川','宝鸡','咸阳','渭南','延安','汉中','榆林','安康','商洛','兰州','嘉峪关','金昌','白银','天水','武威','张掖','平凉','酒泉','庆阳','定西','陇南','临夏','甘南','西宁','海东','海北','黄南','海南','果洛','玉树','海西','银川','石嘴山','吴忠','固原','中卫','乌鲁木齐','克拉玛依','吐鲁番','哈密','昌吉','博尔塔拉','巴音郭楞','阿克苏','克孜勒苏','喀什','和田','伊犁','塔城','阿勒泰','石河子','阿拉尔','图木舒克','五家渠','北屯','铁门关','双河','可克达拉','昆玉','胡杨河','新星'];
const APPLIANCE_OPTIONS = ['洗衣机', '空调', '热水器', '冰箱', '燃气灶'];

function App() {
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [currentCity, setCurrentCity] = useState('南宁');
  const [rentalTips, setRentalTips] = useState([]);
  const [companyTips, setCompanyTips] = useState([]);
  const [showPeopleInput, setShowPeopleInput] = useState(false);
  const [rentalCoords, setRentalCoords] = useState(null);
  const [companyCoords, setCompanyCoords] = useState(null);
  const [form] = Form.useForm();

  const hasSubway = useMemo(() => SUBWAY_CITIES.includes(currentCity), [currentCity]);

  // 铁律：必须保留坐标锁死逻辑 (onSelect 强制记录坐标)
  const fetchTips = useCallback(
    nativeDebounce(async (val, type, city) => {
      if (!val || val.trim().length < 2) return;
      try {
        const res = await axios.post('http://127.0.0.1:5000/api/tips', { keyword: val, city });
        const opts = res.data.map(t => ({ value: t.name, location: t.location, label: `${t.name} (${t.district})` }));
        if (type === 'rental') setRentalTips(opts); else setCompanyTips(opts);
      } catch (e) { console.error('联想请求异常'); }
    }, 400),
    []
  );

  // 铁律：必须保留 GPS 定位功能
  const handleGPS = () => {
    if (!navigator.geolocation) return message.error('浏览器不支持GPS');
    const hide = message.loading('获取定位中...', 0);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await axios.post('http://127.0.0.1:5000/api/regeo', { lng: pos.coords.longitude, lat: pos.coords.latitude });
        hide();
        if (res.data.address) {
          form.setFieldsValue({ rental_address: res.data.address });
          setRentalCoords(`${pos.coords.longitude},${pos.coords.latitude}`);
          message.success('定位成功并已锁定坐标');
        }
      } catch { hide(); message.error('定位转换失败'); }
    }, () => { hide(); message.error('请授予地理位置访问权限'); });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const appliances = {};
      APPLIANCE_OPTIONS.forEach(a => appliances[a] = values.appliances?.includes(a));
      const payload = {
        ...values, city: currentCity,
        addresses: { rental: rentalCoords || values.rental_address, company: companyCoords || values.company_address },
        house_info: { total_people: values.people || 1, total_area: values.area, floor: values.floor, has_elevator: values.elevator, has_bathroom: values.bathroom },
        hardware: { appliances }
      };
      const res = await axios.post('http://127.0.0.1:5000/api/score', payload);
      setScoreData(res.data);
    } catch { message.error('评估过程出错，请确保从下拉框点选地址'); }
    finally { setLoading(false); }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #eee' }}>
        <h2 style={{ color: '#1890ff', margin: 0 }}>飞猪租房智能评分 - V7.2.0 (全量修复版)</h2>
      </Header>
      <Content style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Row gutter={24}>
          <Col span={10}>
            <Card title="核心参数录入" style={{ borderRadius: 12 }}>
              {/* 铁律：所有必填项必须有 required 属性 */}
              <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ city: '南宁', rent: 2000, income: 6000, commute_mode: 'subway', rent_type: 'solo', people: 1, floor: 5, elevator: true, bathroom: true }}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label="城市" name="city" rules={[{ required: true }]}>
                      <Select showSearch onChange={(v) => { setCurrentCity(v); setRentalCoords(null); }}>
                        {ALL_CITIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    {/* 铁律：禁止删减通勤方式 */}
                    <Form.Item label="通勤方式" name="commute_mode" rules={[{ required: true }]}>
                      <Select>
                        <Option value="subway" disabled={!hasSubway}>🚇 地铁 {!hasSubway && '(未通)'}</Option>
                        <Option value="bus">🚌 公交</Option>
                        <Option value="walking">🚶 步行</Option>
                        <Option value="cycling">🚲 骑行</Option>
                        <Option value="driving">🚗 驾车</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="房源地址 (下拉点选)" required style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Form.Item name="rental_address" rules={[{ required: true, message: '必选' }]} style={{ flex: 1 }}>
                      <AutoComplete options={rentalTips} onSearch={(v) => fetchTips(v, 'rental', currentCity)} onSelect={(val, opt) => setRentalCoords(opt.location)}>
                        <Input prefix={<EnvironmentOutlined />} placeholder="输入房源名..." allowClear />
                      </AutoComplete>
                    </Form.Item>
                    <Button icon={<AimOutlined />} onClick={handleGPS}>定位</Button>
                  </div>
                </Form.Item>

                <Form.Item label="公司地址 (下拉点选)" name="company_address" rules={[{ required: true }]}>
                  <AutoComplete options={companyTips} onSearch={(v) => fetchTips(v, 'company', currentCity)} onSelect={(val, opt) => setCompanyCoords(opt.location)}>
                    <Input prefix={<CarOutlined />} placeholder="输入公司名..." allowClear />
                  </AutoComplete>
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}><Form.Item label="租金 (￥)" name="rent" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="月薪 (￥)" name="income" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                </Row>

                <Form.Item label="租住类型" name="rent_type">
                    <Select onChange={(v)=>setShowPeopleInput(v==='family'||v==='shared')}>
                        <Option value="solo">👤 独居</Option>
                        <Option value="couple">👫 情侣</Option>
                        <Option value="family">👨‍👩‍👧‍👦 家庭</Option>
                        <Option value="shared">🤝 合租</Option>
                    </Select>
                </Form.Item>
                {showPeopleInput && <Form.Item label="实际人数" name="people" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} prefix={<UserOutlined />} /></Form.Item>}

                <Form.Item label="基础配套" name="appliances"><Checkbox.Group options={APPLIANCE_OPTIONS} /></Form.Item>

                <Row gutter={12}>
                  {/* 铁律：禁止删减楼层和面积 */}
                  <Col span={8}><Form.Item label="面积" name="area" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={8}><Form.Item label="楼层" name="floor" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={8}><Form.Item label="电梯" name="elevator" valuePropName="checked"><Switch /></Form.Item></Col>
                </Row>
                <Form.Item label="独卫" name="bathroom" valuePropName="checked"><Switch /></Form.Item>

                <Button type="primary" block size="large" htmlType="submit" loading={loading} style={{ borderRadius: 8, height: 48 }}>深度扫描配套</Button>
              </Form>
            </Card>
          </Col>
          <Col span={14}>
            {scoreData ? (
                <Card style={{ borderRadius: 12 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 14, color: '#888' }}>房源综合分</div>
                        <div style={{ fontSize: 60, fontWeight: 'bold', color: '#1890ff' }}>{scoreData.total_score}</div>
                    </div>
                    <div style={{ height: 260 }}>
                        <ResponsiveContainer>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: '租金', A: scoreData.details['收入租金比'].score, fullMark: 10 },
                                { subject: '通勤', A: scoreData.details['通勤时间'].score, fullMark: 10 },
                                { subject: '配套', A: scoreData.details['周边配套'].score, fullMark: 10 },
                                { subject: '硬件', A: scoreData.details['硬件配套'].score, fullMark: 10 },
                                { subject: '户型', A: scoreData.details['户型结构'].score, fullMark: 10 },
                            ]}>
                                <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis domain={[0, 10]} />
                                <RechartsRadar dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ background: '#fcfcfc', padding: 20, borderRadius: 8 }}>
                        {Object.entries(scoreData.details).map(([k, v]) => (
                            <div key={k} style={{ marginBottom: 15, borderBottom: '1px dashed #eee', paddingBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'bold' }}>{k}</span>
                                    <Tag color="blue">{v.score} 分</Tag>
                                </div>
                                <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>{v.desc}</div>
                                
                                {k === '周边配套' && (
                                    <div style={{ marginTop: 10, background: '#fff', border: '1px solid #f0f0f0', padding: 10, borderRadius: 6 }}>
                                        {/* 任务修复：纵向排列展示交通站点 */}
                                        <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 5 }}>📍 核心交通 (地铁优先)：</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                                            {v.transport?.slice(0, 5).map((t, i) => <div key={i} style={{fontSize: 11, color: '#444'}}>· {t}</div>)}
                                        </div>
                                        
                                        {/* 任务修复：纵向排列展示品牌清单，截断且支持“等等” */}
                                        <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 5 }}>🔥 名牌清单 (离住处由近到远)：</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {v.brands?.slice(0, 5).map((b, i) => (
                                                <div key={i} style={{ fontSize: 11, color: '#444' }}>
                                                    · {b}
                                                </div>
                                            ))}
                                            {v.brands?.length > 5 && (
                                                <div style={{ fontSize: 11, color: '#999', paddingLeft: 8, fontStyle: 'italic' }}>等等...</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            ) : <Card style={{ height: 650, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{textAlign:'center', color:'#ccc'}}><ShopOutlined style={{fontSize: 48}}/><p>数据已就绪，请录入参数进行深度扫描</p></div></Card>}
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;