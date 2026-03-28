class CashierCreateController
{
    private $publickey;
    private $merchantId;
    private $url;

    public function __construct() {
        $this->merchantId = '281826031972036';
        $this->publickey = 'OPAYPUB17739480140190.0012398578552614836';
        $this->url = 'https://testapi.opaycheckout.com/api/v1/international/cashier/create';
    }

    public function test(){
        $data = [
            'country' => 'NG',
            'reference' => time() . rand(1000, 9999),
            'amount' => [
                "total"=> "300",
                "currency"=> 'NGN',
            ],
            'returnUrl' => 'https://your-return-url',
            'callbackUrl'=> 'https://your-call-back-url',
            'cancelUrl' => 'https://your-cacel-url',
            'evokeOpay' => true,
            'customerVisitSource' => 'IOS',
            'expireAt' => 30,
            'sn' => 'PE462xxxxxxxx',
            'userInfo' => [
                "userEmail"=> 'xxx@xxx.com',
                "userId"=> 'userid001',
                "userMobile"=> '13056288895',
                "userName"=> 'xxx',
            ],
            'product' => [

                "name"=> 'name',
                "description"=> 'description'

            ],
            'payMethod'=>'BankCard',
        ];
        $data2 = (string) json_encode($data,JSON_UNESCAPED_SLASHES);
        $header = ['Content-Type:application/json', 'Authorization:Bearer '. $this->publickey, 'MerchantId:'.$this->merchantId];
        $response = $this->http_post($this->url, $header, json_encode($data));
        $result = $response?$response:null;
        return $result;
    }

    private function http_post ($url, $header, $data) {
        if (!function_exists('curl_init')) {
            throw new Exception('php not found curl', 500);
        }
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_HEADER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);
        $response = curl_exec($ch);
        $httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error=curl_error($ch);
        curl_close($ch);
        if (200 != $httpStatusCode) {
            print_r("invalid httpstatus:{$httpStatusCode} ,response:$response,detail_error:" . $error, $httpStatusCode);
        }
        return $response;
    }
}