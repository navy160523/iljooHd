<!-- 
  * Vue 내 용 : 성과평가 현황
  * 작 성 자 : 일주지앤에스 김용환
  * 최초 작성일 : 2024/05/20
  * 최종 수정자 : 일주지앤에스 김용환
  * 최종 수정일 : 2024/05/20 
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import MNGBA0010Popup01 from '@/pages/10_management/MNG_B/MNGBA0010Popup01.vue'
import MNGBA0010Popup02 from '@/pages/10_management/MNG_B/MNGBA0010Popup02.vue'
import MNGBA0010Popup03 from '@/pages/10_management/MNG_B/MNGBA0010Popup03.vue'
import MNGBA0010Popup04 from '@/pages/10_management/MNG_B/MNGBA0010Popup04.vue'
import MNGBA0010Popup05 from '@/pages/10_management/MNG_B/MNGBA0010Popup05.vue'
// import MNGBA0010Popup06 from '@/pages/10_management/MNG_B/MNGBA0010Popup06.vue'
import MNGBA0010Popup07 from '@/pages/10_management/MNG_B/MNGBA0010Popup07.vue'
import MNGBA0010Popup08 from '@/pages/10_management/MNG_B/MNGBA0010Popup08.vue'
import MNGBA0010Popup09 from '@/pages/10_management/MNG_B/MNGBA0010Popup09.vue'
import MNGBA0010Popup10 from '@/pages/10_management/MNG_B/MNGBA0010Popup10.vue'
import MNGBA0010Popup11 from '@/pages/10_management/MNG_B/MNGBA0010Popup11.vue'
import MNGBA0010Popup12 from '@/pages/10_management/MNG_B/MNGBA0010Popup12.vue'
import MNGBA0010Popup13 from '@/pages/10_management/MNG_B/MNGBA0010Popup13.vue'
import MNGBA0010Popup14 from '@/pages/10_management/MNG_B/MNGBA0010Popup14.vue'
// import MNGBA0010Popup15 from '@/pages/10_management/MNG_B/MNGBA0010Popup15.vue'
import MNGBA0010Popup16 from '@/pages/10_management/MNG_B/MNGBA0010Popup16.vue'
import MNGBA0010Popup17 from '@/pages/10_management/MNG_B/MNGBA0010Popup17.vue'
import MNGBA0010Popup18 from '@/pages/10_management/MNG_B/MNGBA0010Popup18.vue'
import MNGBA0010Popup19 from '@/pages/10_management/MNG_B/MNGBA0010Popup19.vue'
import MNGBA0010Popup20 from '@/pages/10_management/MNG_B/MNGBA0010Popup20.vue'

defineOptions({
  name:'10_management-MNG_B-MNGBA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()      //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const mNGBA0010Popup01 = ref(null)
const mNGBA0010Popup02 = ref(null) 
const mNGBA0010Popup03 = ref(null)
const mNGBA0010Popup04 = ref(null)
const mNGBA0010Popup05 = ref(null)
const mNGBA0010Popup06 = ref(null)
const mNGBA0010Popup07 = ref(null)
const mNGBA0010Popup08 = ref(null)
const mNGBA0010Popup09 = ref(null)
const mNGBA0010Popup10 = ref(null)
const mNGBA0010Popup11 = ref(null)
const mNGBA0010Popup12 = ref(null)
const mNGBA0010Popup13 = ref(null)
const mNGBA0010Popup14 = ref(null)
// const mNGBA0010Popup15 = ref(null)
const mNGBA0010Popup16 = ref(null)
const mNGBA0010Popup17 = ref(null)
const mNGBA0010Popup18 = ref(null)
const mNGBA0010Popup19 = ref(null)
const mNGBA0010Popup20 = ref(null)

const btnGridInfo = reactive({
  MENU_INFO : [
    {TITLE : '중점추진사항\n이행현황', LAW_NM : '법4조1호 시행령1호', POPUP : mNGBA0010Popup01},
    // {TITLE : '부문별\nHSE 중점추진사항\n이행현황', LAW_NM : '법4조1호 시행령1호', POPUP : mNGBA0010Popup15},
    {TITLE : '조직도', LAW_NM : '법4조1호 시행령2호', POPUP : mNGBA0010Popup16},
    {TITLE : '위험성평가 현황', LAW_NM : '법4조1호 시행령3호', POPUP : mNGBA0010Popup02},
    {TITLE : '수시 위험성평가 현황', LAW_NM : '법4조1호 시행령3호', POPUP : mNGBA0010Popup03},
    {TITLE : '중대재해차단대책 이행점검\n(고위험점검, \n부서관리작업점검)', LAW_NM : '법4조1호 시행령3호', POPUP : mNGBA0010Popup04},//화면 교체
    {TITLE : '계층별 안전점검', LAW_NM : '법4조1호 시행령3호', POPUP : mNGBA0010Popup17},
    {TITLE : 'Hi-SAFE', LAW_NM : '법4조1호 시행령3호', POPUP : mNGBA0010Popup13},
    {TITLE : '안전보건인력\n법적 선임 및 교육이수\n현황', LAW_NM : '법4조1호 시행령6호', POPUP : mNGBA0010Popup05},
    // {TITLE : '산업안전보건협의회', LAW_NM : '법4조1호 시행령7호', POPUP : mNGBA0010Popup06},
    {TITLE : '협력사\n안전보건협의회', LAW_NM : '법4조1호 시행령7호', POPUP : mNGBA0010Popup07},
    {TITLE : '전사 RISK 공모전', LAW_NM : '법4조1호 시행령7호', POPUP : mNGBA0010Popup08},
    {TITLE : '비상조치계획\n수립 및 훈련', LAW_NM : '법4조1호 시행령8호', POPUP : mNGBA0010Popup09},
    {TITLE : '협력사 안전보건\n수준평가', LAW_NM : '법4조1호 시행령9호', POPUP : mNGBA0010Popup10},
    {TITLE : '협력사 합동안전\n보건점검', LAW_NM : '법4조1호 시행령9호', POPUP : mNGBA0010Popup18},
    {TITLE : '주요 사고 현황\n및 재발방지대책\n이행 현황', LAW_NM : '법4조2호', POPUP : mNGBA0010Popup14},
    {TITLE : '중대성사고 대책 이행점검', LAW_NM : '법4조2호', POPUP : mNGBA0010Popup19},
    {TITLE : '안전보건 관계법령\n이행점검 결과', LAW_NM : '법4조4호 시행령1호', POPUP : mNGBA0010Popup11},
    {TITLE : '안전보건 교육 이행점검', LAW_NM : '법4조4호 시행령3호', POPUP : mNGBA0010Popup12},
    {TITLE : '관리감독자 안전평가', LAW_NM : '법4조5호', POPUP : mNGBA0010Popup20}
  ],
  COL_CNT : 5,
})

//메뉴버튼
const onButtonsClick = btn => {
  btnGridInfo.MENU_INFO[(btn-1)].POPUP.openPopup()
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 pb-0 content-area">
      <div class="d-flex flex-column fill-height">
        <div class="fill-height">
          <div
            class="d-flex pt-2 mx-n1"
            v-for="odrRowIdx in Math.ceil(btnGridInfo.MENU_INFO.length / btnGridInfo.COL_CNT)"
            :style="{
                  maxHeight:Math.round(100 / Math.ceil(btnGridInfo.MENU_INFO.length / btnGridInfo.COL_CNT) - 1) + '%',
                  minHeight:Math.round(100 / Math.ceil(btnGridInfo.MENU_INFO.length / btnGridInfo.COL_CNT) - 1) + '%',
                }"
            :key="`row--odr__${odrRowIdx}`" 
          >
            <div 
              class="px-1"
              v-for="odrColIdx in btnGridInfo.COL_CNT"
              :style="{
                  flexBasis :(100 / btnGridInfo.COL_CNT)+'%',
                }"
              :key="`row--odr__${((odrRowIdx-1) * btnGridInfo.COL_CNT) + odrColIdx}`"
            >
              <v-card
                class="MngbaCard fill-height"
                v-if="btnGridInfo.MENU_INFO[Math.ceil(((odrRowIdx-1) * btnGridInfo.COL_CNT) + odrColIdx - 1)]"
                color="primary"
                @click="onButtonsClick(Math.ceil((odrRowIdx-1) * btnGridInfo.COL_CNT) + odrColIdx) "
              >
                <p class="text-textIndex f-18 w-700">{{ `${Math.ceil(((odrRowIdx-1) * btnGridInfo.COL_CNT) + odrColIdx).toString()}.` }}</p>
                <p class="f-24 w-700 text-white multiline-editor" style="line-height: 120% ;">{{ btnGridInfo.MENU_INFO[Math.ceil(((odrRowIdx-1) * btnGridInfo.COL_CNT) + odrColIdx - 1)].TITLE }}</p>                 
                <svg-icon name="arrow-right" />
                <p class="f-19 text-white" style="line-height: 120% ; position : absolute; transform:translateX(-50%); left : 50% ; bottom : 20px; align-self: center;">[{{ btnGridInfo.MENU_INFO[Math.ceil(((odrRowIdx-1) * btnGridInfo.COL_CNT) + odrColIdx - 1)].LAW_NM }}]</p>  
              </v-card>                
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
    <MNGBA0010Popup01 ref="mNGBA0010Popup01" />
    <MNGBA0010Popup02 ref="mNGBA0010Popup02" />
    <MNGBA0010Popup03 ref="mNGBA0010Popup03" />
    <MNGBA0010Popup04 ref="mNGBA0010Popup04" />
    <MNGBA0010Popup05 ref="mNGBA0010Popup05" />
    <!-- <MNGBA0010Popup06 ref="mNGBA0010Popup06" /> -->
    <MNGBA0010Popup07 ref="mNGBA0010Popup07" />
    <MNGBA0010Popup08 ref="mNGBA0010Popup08" />
    <MNGBA0010Popup09 ref="mNGBA0010Popup09" />
    <MNGBA0010Popup10 ref="mNGBA0010Popup10" />
    <MNGBA0010Popup11 ref="mNGBA0010Popup11" />
    <MNGBA0010Popup12 ref="mNGBA0010Popup12" />
    <MNGBA0010Popup13 ref="mNGBA0010Popup13" />
    <MNGBA0010Popup14 ref="mNGBA0010Popup14" />
    <!-- <MNGBA0010Popup15 ref="mNGBA0010Popup15" /> -->
    <MNGBA0010Popup16 ref="mNGBA0010Popup16" />
    <MNGBA0010Popup17 ref="mNGBA0010Popup17" />
    <MNGBA0010Popup18 ref="mNGBA0010Popup18" />
    <MNGBA0010Popup19 ref="mNGBA0010Popup19" />
    <MNGBA0010Popup20 ref="mNGBA0010Popup20" />
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 200px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 600px;
  }
}

.border-style {
  font-size: 20px; 
  border: 1px solid rgb(201, 187, 187);
  border-radius: 20px;
  margin: 16px;
}
.MngbaCard {
  width: 100%;
  padding: 32px 32px;
  border-radius: 8px;
  position: relative;
  box-shadow: none;
  transition: all 0.4s ease-in-out;
  background: #1a40c7;
  .svg-icon{
    position: absolute;
    float:right;
    bottom: 60px;
    right: 32px;
    color: rgba(255, 255, 255, 0.5);
  }
  &:hover {
    background: linear-gradient(133deg, #1a40c7 14.54%, #0d1f61 179.43%);
    box-shadow: 5px 5px 20px 0px rgba(28, 49, 121, 0.5);
    .svg-icon{
      color: rgba(255, 255, 255, 1) ;
    } 
  }
}
</style>