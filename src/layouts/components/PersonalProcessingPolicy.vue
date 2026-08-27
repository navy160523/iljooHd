<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from 'vue-i18n'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const dialog = ref(false)

const data = ref(`
    <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko" lang="ko">

    <head>
    <title>개인정보처리방침</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
    body {font-family: 'NanumGothic'}
    </style>
    </head>
    <body>
            <div class="wrap"> <!-- 전체그룹 -->
            <p align="center" style="line-height:1.2;margin-top:0;margin:40px 0px 20px 0px;"><font style="font-family:NanumGothic;font-size:18pt;font-weight:bold">개인정보처리방침</font></p>
                <div style="max-width:1100px;margin: 0 auto; text-align:center;border: 2px solid #bbb; padding:2%;margin-bottom:50px;">
                    <div class="policy"> 
                    
                    <p align="justify" style="line-height:18pt;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">'HD현대'(이하 '회사'라 한다)는 정보주체의 개인정보를 중요시하며, [개인정보보호법], [정보통신망 이용촉진 및 정보보호 등에 관한 법률], [통신비밀보호법], [전기통신사업법] 등 관련 법령상의 개인정보보호규정을 준수하고, 관련 법령의 규정에 따라 수집, 보유 및 처리하는 개인정보를 업무의 적절한 수행과 정보주체의 권익을 보호하기 위해 적법하고 적정하게 취급할 것입니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">또한 회사는 관련 법령에 따라 정보주체의 개인정보 보호 및 권익을 보호하고 개인정보와 관련한 정보주체의 고충을 원활하게 처리할 수 있도록 다음과 같은 개인정보처리방침을 두고 있으며, 개인정보처리방침을 개정하는 경우에는 웹사이트 공지사항(또는 개별공지)을 통하여 공지할 것입니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">본 방침은 2020년 06월 16일부터 시행됩니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">1. 수집하는 개인정보의 항목 및 수집방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">가. 수집하는 개인정보의 항목 </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-19pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">1) 회사는 회사의 관련 홈페이지 회원가입 및 관리, 고객상담, 각종 재화 또는 서비스 제공 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;(1) 필수항목</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 성명, 생년월일, 연락처(핸드폰 등), 이메일</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;(2) 선택항목</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 주소, 증명사진</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">2) 서비스 이용과정이나 사업처리 과정에서 아래와 같은 정보들이 자동으로</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:60pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">생성되어 수집될 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;(1) IP Address, 쿠키, 방문일시, 서비스 이용기록, 불량 이용기록 등</font></p>                
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;나. 개인정보 수집방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;회사가 정보주체로부터 개인정보를 수집하는 방법은 아래와 같습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;1) 홈페이지 회원가입</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;2) 협력회사로부터의 제공 등 기타 수집방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">2. 개인정보의 처리목적</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 정보주체로부터 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">가. 공사 안전관리</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:53pt"><font style="font-family:NanumGothic;font-size:12pt">회사에서 수행하는 공사에 대한 안전관리를 위한 목적으로 개인정보를 처리</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:53pt"><font style="font-family:NanumGothic;font-size:12pt">합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">나. 출입관리 및 출입증 발급</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:53pt"><font style="font-family:NanumGothic;font-size:12pt">회사에 공사를 수행하기 위해 출입하는 인원들의 본인 확인 및 출입증 발급을 </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:53pt"><font style="font-family:NanumGothic;font-size:12pt">위한 목적으로 개인정보를 처리합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">3. 개인정보의 제3자 제공</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">회사는 정보주체의 개인정보를 개인정보의 수집목적 및 이용목적에서 고지한 범위 내에서 사용하며, 정보주체의 사전 동의 없이는 목적 범위를 초과하여 이용하거나 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:21pt"><font style="font-family:NanumGothic;font-size:12pt">가. 정보주체로부터 별도의 동의를 받은 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:21pt"><font style="font-family:NanumGothic;font-size:12pt">나. 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위해 불가피한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:21pt"><font style="font-family:NanumGothic;font-size:12pt">다. 정보주체 또는 그 대리인이 의사표시를 할 수 없는 상태에 있거나 주소 불명</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">등으로 사전동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">라. 다음의 어느 하나에 해당하는 경우에는 정보주체 또는 제3자의 이익을 부당하게</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;침해할 우려가 있을 때를 제외하고는 정보주체의 개인정보를 목적 외의 용도로</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;이용하거나 이를 제3자에게 제공할 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">1) 통계작성 및 학술연구 등의 목적을 위하여 필요한 경우로서 특정 개인을 알아볼</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;수 없는 형태로 개인정보를 제공하는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;2) 개인정보를 목적 외의 용도로 이용하거나 이를 제3자에게 제공하지 아니하면</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;다른 법률에서 정하는 소관 업무를 수행할 수 없는 경우로서 보호위원회의</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;심의, 의결을 거친 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;3) 조약, 그 밖의 국제협정의 이행을 위하여 외국정보 또는 국제기구에 제공하기</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;위하여 필요한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;4) 범죄의 수사와 공소의 제기 및 유지를 위해 필요한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;5) 법원의 재판업무 수행을 위하여 필요한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">6) 형(刑) 및 감호, 보호처분의 집행을 위하여 필요한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;마. 제 3자에게 제공되는 경우 개인정보를 제공받은 제 3자, 제 3자의 이용목적,</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">제공하는 개인정보항목, 제공받은 자의 보유 이용기간에 대한 정보를 정보주체에게</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">알리겠습니다. </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">4. 개인정보의 취급위탁</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 제3자와의 위탁계약 체결시 개인정보보호호법 제25조에 따라 위탁업무 수행</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고,</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">수탁자가 개인정보를 안전하게 처리하는지를 감독하도록 하겠습니다. </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">회사의 개인정보 위탁처리 기관 및 위탁업무내용은 아래와 같습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p style="margin-top:0;margin-bottom:0"><table cellpadding="0" cellspacing="0" height="61" width="618" border="0" style="border-collapse:collapse;border:none;margin:0 0 0 70">
                    <tbody><tr height="21">
                    <td valign="top" width="277" height="21" style="border-top:solid black 1pt;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">수 탁 자</font></p></td>
                    <td valign="top" width="341" style="border-top:solid black 1pt;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">위탁 사무명</font></p></td></tr>
                    <tr height="20">
                    <td valign="top" width="277" height="20" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt"> 에이치엔아이엑스 </font></p></td>
                    <td valign="top" width="341" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">시스템 유지 보수</font></p></td></tr>
                    <tr height="20">
                    <td valign="top" width="277" height="20" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p></td>
                    <td valign="top" width="341" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p></td></tr></tbody></table></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">5. 개인정보의 보유 및 이용기간</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 처리 중인 개인정보를 지체없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">가. 회사 내부 방침에 의한 정보보유사유</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 개인정보에 관한 회사 내부방침에 따라 정보주체의 동의를 받아 개인정보를</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">보관합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:36pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 부정이용 방지를 위한 부정이용 기록 자료 : 1년간 보관</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:36pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 회사 공사 수행 이력관리 및 공사수행 적합여부 판별 : 영구 보관</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">나. 관련 법령에 의한 정보보유 사유</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-53pt;margin-left:53pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">상법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관련법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 관련법령에서 정한 일정한 기간 동안 개인정보를 보관합니다. 이 경우 회사는 보관하는 정보를 그 보관의 목적으로만 이용하며 보존기간은 아래와 같습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-53pt;margin-left:53pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p style="margin-top:0;margin-bottom:0"><table cellpadding="0" cellspacing="0" height="374" width="640" border="0" style="border-collapse:collapse;border:none;margin:0 0 0 70">
                    <tbody><tr height="31">
                    <td width="278" height="31" style="border-top:solid black 1pt;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">구분</font></p></td>
                    <td width="268" style="border-top:solid black 1pt;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">보관사유</font></p></td>
                    <td width="94" style="border-top:solid black 1pt;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">보존기간</font></p></td></tr>
                    <tr height="61">
                    <td width="278" height="61" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 계약 또는 청약철회, 대금결제,</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">재화 등의 공급 기록</font></p></td>
                    <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 전자상거래 등에서의 소비자</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">보호에 관한 법률</font></p></td>
                    <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">5년</font></p></td></tr>
                    <tr height="61">
                    <td width="278" height="61" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 소비자의 불만 또는 분쟁처리에</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">관한 기록</font></p></td>
                    <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 전자상거래 등에서의 소비자</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">보호에 관한 법률</font></p></td>
                    <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">3년</font></p></td></tr>
                    <tr height="59">
                    <td width="278" height="59" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 표시, 광고에 관한 기록</font></p></td>
                    <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 전자상거래 등에서의 소비자</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">보호에 관한 법률</font></p></td>
                    <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">6개월</font></p></td></tr>
                    <tr height="78">
                    <td width="278" height="78" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 가입자 전기통신일시, 개시 및</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:11pt"><font style="font-family:NanumGothic;font-size:12pt">종료시간, 상대방 가입자번호,</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:11pt"><font style="font-family:NanumGothic;font-size:12pt">사용도수, 발신기지국 위치추적</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:11pt"><font style="font-family:NanumGothic;font-size:12pt">자료</font></p></td>
                    <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 정보통신 이용촉진 및 정보보호</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">등에 관한 법률</font></p></td>
                    <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">1년</font></p></td></tr>
                    <tr height="44">
                    <td width="278" height="44" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 컴퓨터통신, 인터넷 로그기록</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">자료, 접속지 추적자료</font></p></td>
                    <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 정보통신 이용촉진 및 정보보호</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">등에 관한 법률</font></p></td>
                    <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">3개월</font></p></td></tr>
                    <tr height="40">
                    <td width="278" height="40" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 본인확인에 관한 기록</font></p></td>
                    <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 정보통신 이용촉진 및 정보보호</font></p><p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">등에 관한 법률</font></p></td>
                    <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">6개월</font></p></td></tr>
                    <tr height="44">
                        <td width="278" height="44" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 사고 발생시 재해자에 관한 기록</font></p></td>
                        <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 산업안전보건법 등에서의</font></p>
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">산업재해 발생 기록 및 서류의</font></p>
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">보존에 관한 법률</font></p>
                        </td>
                        <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">3년</font></p></td>
                    </tr>
                    <tr height="44">
                        <td width="278" height="44" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 산재관련 재해자에 관한 기록</font></p></td>
                        <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 산업재해보상보험법</font></p>
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">시행령 제127조 2</font></p>
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">(민감정보 및 고유식별정보의 처리)에 관한 법률</font></p>
                        </td>
                        <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">3년</font></p></td>
                    </tr>
                    <tr height="44">
                        <td width="278" height="44" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt"><p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 근로자 건강검진에 관한 기록</font></p></td>
                        <td width="268" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">- 산업안전보건법 등에서의</font></p>
                            <p style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">건강진단 결과의 보존에 관한 법률</font></p>                         
                        </td>
                        <td width="94" style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt"><p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">5년 또는 30년</font></p></td>
                    </tr>
                    </tbody></table></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">6. 개인정보 파기 절차 및 방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 원칙적으로 개인정보의 수집 및 이용목적이 달성되거나 보유기간이 경과되는 등개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기하겠으며, 회사의 개인정보 파기 절차 및 방법은 다음과 같습니다. 다만 관련 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는 해당 개인정보를 별도의 데이터베이스(DB)</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:12pt">로 옮기거나 보관장소를 달리하여 보존하도록 하겠습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-26pt;margin-left:52pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">가.</font><font style="font-family:NanumGothic;font-size:7pt;font-weight:bold">&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">파기 절차</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 파기 사유가 발생한 개인정보를 선정하고 회사의 개인정보 보호책임자의</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">승인을 받아 개인정보를 파기합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">나. 파기 방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">1) 전자적 파일형태인 경우 : 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:48pt"><font style="font-family:NanumGothic;font-size:12pt">2) 전자적 파일 형태 외의 기록물, 인쇄물, 서면, 그 밖의 기록매체인 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:60pt"><font style="font-family:NanumGothic;font-size:12pt">: 파쇄 또는 소각</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">7. 정보주체의 권리, 의무 및 그 행사 방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;정보주체는 다음과 같은 권리를 행사할 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;가. 개인정보 열람 요구</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-36pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;정보주체는 회사에서 보유하고 있는 개인정보에 대하여 개인정보보호법 제35조(개인정보의 열람)에 의거하여 언제든지 열람을 요구할 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">단, 다음의 경우 회사는 열람을 제한할 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;1) 법률에 따라 열람이 금지되거나 제한되는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">2) 다른 사람의 생명, 신체를 해할 우려가 있거나 다른 사람의 재산과 그 밖의</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">이익을 부당하게 침해할 우려가 있는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">3) 공공기관이 다음의 어느 하나에 해당하는 업무를 수행할 때 중대한 지장을 초래</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">하는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 조세의 부과, 징수 또는 환급에 관한 업무</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- [초, 중등교육법] 및 [고등교육법]에 따른 각급 학교, [평생교육법]에 따른</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;평생교육시설, 그 밖의 다른 법률에 따라 설치된 고등교육기관에서의 성적</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;평가 또는 입학자 선발에 관한 업무</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 학력, 기능 및 채용에 관한 시험, 자격 심사에 관한 업무</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 보상금, 급부금 산정 등에 대하여 진행중인 평가 또는 판단에 관한 업무</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 다른 법률에 따라 진행 중인 감사 및 조사에 관한 업무</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;나. 개인정보 정정, 삭제 요구</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:56pt"><font style="font-family:NanumGothic;font-size:12pt">정보주체는 회사에서 보유하고 있는 개인정보에 대하여 [개인정보보호법] 제36조 (개인정보의 정정,삭제)에 따라 정정, 삭제를 요구할 수 있습니다. 다만, 다른 법령에서 그 개인정보가 수집대상으로 명시되어 있는 경우에는 그 삭제를 요구할 수 없습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;다. 개인정보 처리정지 요구</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-60pt;margin-left:56pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">정보주체는 회사에서 보유하고 있는 개인정보에 대하여 [개인정보보호법] 제37조(개인정보의 처리 정지 등)에 따라 처리정리 요구를 할 수 있습니다. 단, 다음의 경우 처리정지 요구를 거절할 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 다른 사람의 생명, 신체를 해할 우려가 있거나 다른 사람의 재산과 그 밖의</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;이익을 부당하게 침해할 우려가 있는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 공공기관이 개인정보를 처리하지 아니하면 다른 법률에서 정하는 소관 업무를</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;수행할 수 없는 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;- 개인정보를 처리하지 아니하면 정보주체와 약정한 서비스를 제공하지 못하는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">등 계약의 이행이 곤란한 경우로서 정보주체가 그 계약의 해지 의사를 명확</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;하게 밝히지 아니한 경우</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;라. 기타</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-19pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">1) 정보주체 및 법정대리인은 언제든지 등록되어 있는 자신 혹은 당해 만 14세 미만 아동의 개인정보를 조회하거나 수정할 수 있으며, 회사의 개인정보의 처리에 동의하지 않는 경우 동의거부나 가입해지(회원탈퇴)를 요청하실 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-67pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;2) 정보주체 혹은 만 14세 미만 아동의 개인정보 조회, 수정을 위해서는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-7pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">‘개인정보변경’(또는 ‘회원정보수정’ 등), 가입해지(동의철회)를 위해서는 ‘회원탈퇴’를 클릭하여 본인 확인 절차를 거치신 후 직접 열람, 정정 또는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">탈퇴가 가능합니다. 혹은 개인정보관리책임자에게 서면, 전화 또는 이메일로</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:12pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">연락하시면 지체없이 조치하겠습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-72pt;margin-left:72pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;3) 정보주체가 개인정보의 오류에 대한 정정 또는 삭제를 요청하신 경우에는 정정 또는 삭제를 완료하기전까지 당해 개인정보를 이용 또는 제공하지 않습니다. 또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정 또는 삭제 처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록 하겠습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;4) 회사는 정보주체 혹은 법정대리인의 요청에 의해 해지 또는 삭제된 개인정보는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;개인정보의 보유 및 이용기간에 명시된 바에 따라 처리하고, 그 외의 용도로</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;열람 또는 이용할 수 없도록 처리하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">8. 개인정보 자동수집장치의 설치/운영 및 그 거부에 관한 사항</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:26pt"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">가. 쿠키란</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;1) 회사는 개인화되고 맞춤화된 서비스를 제공하기 위해서 정보주체의 정보를 저장</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;하고 수시로 불러오는 ‘쿠키(cookie)’를 사용합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;2) 쿠키는 웹사이트를 운영하는데 이용되는 서버가 정보주체의 브라우저에게 </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">보내는 아주 작은 텍스트 파일로 정보주체 컴퓨터의 하드디스크에 저장됩니다. 이후 정보주체가 웹 사이트에 방문할 경우 웹 사이트 서버는 정보주체의 하드디스크에 저장되어 있는 쿠키의 내용을 읽어 정보주체의 환경설정을 유지하고 맞춤화된 서비스를 제공하기 위해 이용됩니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-67pt;margin-left:67pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;3) 쿠키는 개인을 식별하는 정보를 자동적/능동적으로 수집하지 않으며, 정보주체는 언제든지 이러한 쿠키의 저장을 거부하거나 삭제할 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;나. 회사의 쿠키 사용목적</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;회원과 비회원의 접속 빈도나 방문 시간 등을 분석, 정보주체의 취향과 관심분야를 파악 및 자취 추적, 각종 이벤트 참여 정도 및 방문 회수 파악 등을 통한 타겟 마케팅 및 개인 맞춤 서비스 등을 제공하기 위해 사용합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;다. 쿠키의 설치/ 운영 및 거부</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:1pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">1) 정보주체는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서, 정보주체는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt;margin-left:1pt"><font style="font-family:NanumGothic;font-size:12pt">웹 브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt;margin-left:1pt"><font style="font-family:NanumGothic;font-size:12pt">될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt;margin-left:1pt"><font style="font-family:NanumGothic;font-size:12pt">니다. 다만, 쿠키의 저장을 거부할 경우에는 로그인이 필요한 일부 서비스는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt;margin-left:1pt"><font style="font-family:NanumGothic;font-size:12pt">이용에 어려움이 있을 수 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">2) 쿠키의 설치 허용 여부를 지정하는 방법(Internet Explorer의 경우)은 다음과</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:60pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">같습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt"><font style="font-family:NanumGothic;font-size:12pt">- 웹 브라우저 상단의 [도구] 메뉴에서 [인터넷 옵션]을 선택합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt"><font style="font-family:NanumGothic;font-size:12pt">- [개인정보 탭]을 클릭합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:72pt"><font style="font-family:NanumGothic;font-size:12pt">- [개인정보취급 수준]을 설정하시면 됩니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">9. 개인정보의 안전성 확보 조치</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;회사는 정보주체의 개인정보를 취급함에 있어 개인정보가 분실, 도난, 누출, 변조 또는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;훼손되지 않도록 안전성 확보를 위하여 [개인정보보호법] 제29조에 따라 다음과 같이</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;안전성 확보에 필요한 기술적, 관리적, 물리적 조치를 하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;가. 내부관리계획의 수립 및 시행</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;회사는 ‘개인정보의 안전성 확보조치 기준’에 의거하여 내부관리계획을 수립</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;하여 시행합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;나. 개인정보 취급 담당자의 최소화 및 교육</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;회사의 개인정보관련 취급직원은 담당자에 한정시키고 있고 이를 위한 별도의</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;비밀번호를 부여하여 정기적으로 갱신하고 있으며, 담당자에 대한 수시교육을</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;통하여 회사의 개인정보처리방침의 준수를 항상 강조하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;다. 개인정보에 대한 접근 제한</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며, 개인정보취급자가 정보통신망을 통해 외부에서 개인정보처리시스템에 접속하는 경우에는 가상사설망(VPN : Virtual Private Network)을 이용하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;라. 접속기록의 보관 및 위변조 방지</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;개인정보처리시스템에 접속한 기록(웹 로그 등)을 최소 1년 이상 보관, 관리하고 있으며 접속기록이 위·변조 및 도난 분실되지 않도록 보안기능을 사용하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;마. 개인정보의 암호화</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;정보주체의 개인정보는 암호화되어 저장 및 관리되고 있습니다. 또한 중요한 데이터는 저장 및 전송 시 암호화하여 사용하는 등의 별도 보안기능을 사용하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;바. 해킹 등에 대비한 대책</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;1) 회사는 해킹이나 컴퓨터 바이러스 등에 의해 회원의 개인정보가 유출되거나</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:60pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">훼손되는 것을 막기 위해 최선을 다하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;2) 개인정보의 훼손에 대비해서 자료를 수시로 백업하고 있고, 최신 백신프로그램</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:67pt"><font style="font-family:NanumGothic;font-size:12pt">을 이용하여 정보주체들의 개인정보나 자료가 누출되거나 손상되지 않도록</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:67pt"><font style="font-family:NanumGothic;font-size:12pt">방지 하고 있으며, 암호화 통신 등을 통하여 네트워크상에서 개인정보를 안전</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:67pt"><font style="font-family:NanumGothic;font-size:12pt">하게 전송할 수 있도록 하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;3) 그리고 침입차단시스템을 이용하여 외부로부터의 무단접근을 통제하고 있으며,</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;기타 시스템적으로 보안성을 확보하기 위한 가능한 모든 기술적 장치를 갖추려</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;노력하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;사. 비인가자에 대한 출입통제</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;개인정보를 보관하고 있는 개인정보시스템의 물리적 보관장소를 별도로 두고 이에 대해 출입통제 절차를 수립, 운영하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;아. 비밀번호 암호화</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;비밀번호는 암호화되어 저장 및 관리되고 있어 정보주체만이 알고 있으며, 개인정보의 확인 및 변경도 비밀번호를 알고 있는 정보주체 본인에 의해서만 가능합니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:13pt;font-weight:bold">&nbsp;자. 개인정보보호 조직의 운영</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;사내 개인정보보호조직을 통하여 회사의 개인정보처리방침의 이행사항 및</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;담당자의 준수 여부를 확인하여 문제가 발견될 경우 즉시 수정하고 바로 잡을 수 있도록 노력하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;단, 정보주체 본인의 부주의나 인터넷상의 문제로 ID, 비밀번호, 주민등록번호 등 개인정보가 유출되어 발생한 문제에 대해서는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-48pt;margin-left:48pt"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;회사는 일체의 책임을 지지 않습니다.</font></p>				
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">10. 개인정보관리책임자에 관한 사항</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">회사는 고객인 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보관리책임자를</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">지정하고 있습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:6pt">&nbsp;</font></p>
                    <p style="margin-top:0;margin-bottom:0">
                        <table cellpadding="0" cellspacing="0" height="100" width="1000" border="0" style="border-collapse:collapse;border:none;margin:0 0 0 0">
                        <tbody>
                            <tr height="21">                            
                                <td valign="top" width="100" height="21" style="border-top:solid black 1pt;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">회사</font>
                                    </p>
                                </td>
                                <td valign="top" width="300" height="21" style="border-top:solid black 1pt;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">개인정보보호 책임자</font>
                                    </p>
                                </td>
                                <td valign="top" width="300" style="border-top:solid black 1pt;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">개인정보보호 관리자</font>
                                    </p>
                                </td>
                                <td valign="top" width="300" style="border-top:solid black 1pt;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt;font-weight:bold">개인정보보호 담당자</font>
                                    </p>
                                </td>
                            </tr>
                            <tr height="60">
                                <td height="60" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">HD현대</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 정보보안팀/김성배 이사<br />- 전화번호 : 02-479-5683<br />- 전자우편 : kimsb@hd.com</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 정보보안팀/박윤식 책임<br />- 전화번호 : 02-479-8954<br />- 전자우편 : parkyoonsik@hd.com</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 정보보안팀/김동환 선임<br />- 전화번호 : 02-479-5601<br />- 전자우편 : donghwan.kim01@hd.com</font>
                                    </p>
                                </td>
                            </tr>
                            <tr height="60">
                                <td height="60" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">HD한국조선해양</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 보안관리/이오영 이사<br />- 전화번호 : 02-479-5601<br />- 전자우편 : 118@hd.com</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 보안기획팀/김성배 책임<br />- 전화번호 : 02-479-5683<br />- 전자우편 : kimsb@hd.com</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 보안기획팀/박윤식 책임<br />- 전화번호 : 02-479-8954<br />- 전자우편 : parkyoonsik@hd.com</font>
                                    </p>
                                </td>
                            </tr>
                            <tr height="60">
                                <td height="60" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">HD현대중공업</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 총무/법무부문 김원탁 전무<br />- 전화번호 : 052-202-1118<br />- 전자우편 : 118@hd.com</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 법무보안지원부/유정택 책임<br />- 전화번호 : 052-202-2794<br />- 전자우편 : yu011@hd.com</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="left" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:11pt">- 소속/성명 : 법무보안지원부/이정민 책임<br />- 전화번호 : 052-202-5714<br />- 전자우편 : lee.jeongmin@hd.com</font>
                                    </p>
                                </td>
                            </tr>
                            <!--<tr height="20">
                                <td height="20" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">전화번호 : 052-202-0118</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">전화번호 : 052-202-3187</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">전화번호 : 052-202-2899</font>
                                    </p>
                                </td>
                            </tr>
                            <tr height="20">
                                <td height="20" style="border-top:none;border-left:solid black 1pt;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.40pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">전자우편 : 118@ksoe.co.kr</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">전자우편 : tony.kwon@ksoe.co.kr</font>
                                    </p>
                                </td>
                                <td style="border-top:none;border-left:none;border-bottom:solid black 1pt;border-right:solid black 1pt;padding:0 5.40pt 0 5.05pt">
                                    <p align="center" style="line-height:1.2;margin-top:0;margin-bottom:0">
                                        <font style="font-family:NanumGothic;font-size:12pt">전자우편 : smcho@ksoe.co.kr</font>
                                    </p>
                                </td>
                            </tr>-->
                        </tbody>
                        </table>
                    </p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;margin-left:24pt"><font style="font-family:NanumGothic;font-size:6pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">귀하께서는 회사의 서비스를 이용하시면서 발생하는 모든 개인정보보호 관련 민원을 개인정보관리책임자 혹은 담당자에게</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:24pt"><font style="font-family:NanumGothic;font-size:12pt">신고하실 수 있습니다. 회사는 이용자들의 신고사항에 대해 신속하게 충분한 답변을 드릴 것입니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">11. 개인정보의 열람청구를 접수·처리하는 부서</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;정보주체는 개인정보 보호법 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 할 수 있습니다. 회사는 정보주체의 개인정보 </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;열람청구가 신속하게 처리되도록 노력하겠습니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;개인정보 열람청구 접수·처리 부서</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;- 부서명 : 안전경영부</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;- 담당자 : 윤찬양 책임</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;- 연락처 : 052-203-6394</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;&nbsp;- 전자우편 : mycksdid@hd.com</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">12. 개인정보 처리방침의 변경</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;가능한 변경사항의 시행 7일전부터 공지사항을 통하여 고지하도록 노력할 것입니다.</font></p>				
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:14pt;font-weight:bold">13. 권익침해 구제 방법</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;넷진흥원 개인정보침해신고센터 등에 분쟁 해결이나 상담을 신청하실 수 있습니다. 이 </font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;밖에 기타 개인정보침해의 신고, 상담에 대하여는 아래의 기관에 문의하시기 바랍니다.</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0;text-indent:-24pt;margin-left:41pt"><font style="font-family:NanumGothic;font-size:12pt">가.</font><font style="font-family:NanumGothic;font-size:7pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:7pt">&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">개인정보 분쟁조정위원회 : (국번없이) 118(내선2번)</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;나. 대검찰청 사이버범죄수사단 : 02-3480-3573 (</font><a href="http://www.spo.go.kr/"><font style="font-family:NanumGothic;font-size:12pt">http://www.spo.go.kr/</font></a><font style="font-family:NanumGothic;font-size:12pt">)</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;다. 경찰청 사이버테러대응 센터 : 1566-0112 (http://www.netan.go.kr/)</font></p>
                    <p align="justify" style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;&nbsp;</font><font style="font-family:NanumGothic;font-size:12pt">&nbsp;라. 정보보호마크인증위원회 : 02-580-0533~4 (http://eprivacy.or.kr)</font></p>
                    <p style="line-height:1.2;margin-top:0;margin-bottom:0"><font style="font-family:NanumGothic;font-size:12pt">&nbsp;</font></p>
                    </div>
                </div>
            </div>
        </form>
    </body>
    </html>
`)

const openPopup = val => {
  dialog.value = true
}

const onButtonsClick = btn => {
  dialog.value = false 
}

defineExpose({
  openPopup,
})
</script>
<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1200"
    height="1000"
    class="user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move justify-space-between"
      @mousedown="startDragging"
    >
      <span>개인정보처리방침</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pt-0 content-area">
        <div class="d-flex flex-column h-auto">
          <!-- <v-sheet class="searchArea flex-column">
            tttt
          </v-sheet> -->
          <v-sheet class="h-auto" >
            <div v-html="data">

            </div>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>