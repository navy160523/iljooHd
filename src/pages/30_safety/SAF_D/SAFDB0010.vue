<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import RealGrid from "@/components/RealGrid.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from "dayjs"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, commonLogExecuteApi, getCodeList } from "@hiway/api/commonApi"
defineOptions({
  name:'30_safety-SAF_D-SAFDB0010',
})
import ILabel from "@/components/ILabel.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const searchArea = ref(null)

const grdMain = ref(null)
const menuTitle = ref(null)
/* 조회 데이터 */
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: '',
  VIO_DATE_FR: dayjs(new Date).startOf('M').format('YYYY-MM-DD'),
  VIO_DATE_TO: dayjs(new Date).format('YYYY-MM-DD'),
  VIO_YEAR: dayjs(new Date).format('YYYY'),
  DATE_YN:'Y',
  IO_DIV:'',
  PROD_DIV:'',
  VIO_GDIV:'',
  SHIP_NO:'',
})

/* 코드 리스트 */
const codeList = reactive({
  CMPNY_List: [],      // 회사구분
  BSNSList: [],        // 사업부
  DEPTList: [{ ASGN_SHRT_NM:'전체', DEPT_CD: '' }],      // 부서
  IO_DIVList: [                                      // 소속구분
    { label: '전체', value: '' }, 
    { label: '직영', value: 'A' }, 
    { label: '협력사', value: 'B' },
    // { label: '단기공사', value: 'D' },
    // { label: '기타', value: 'Z' },  
  ], 
  PROD_DIVList: [                      
    { label: '전체', value: '' }, 
    { label: '생산', value: 'Y' }, 
    { label: '비생산', value: 'N' },  
  ],
  VIO_GDIVList: [
    { TXT: '전체', COD: '' },
    { TXT: '절대수칙', COD: 'A' },
    { TXT: '일반수칙', COD: 'B' },
    { TXT: '중대성수칙', COD: 'D' },//중대성 사고예방
    { TXT: '중대성사고예방 중점관리항목(조선)', COD: 'D10' },
    { TXT: '중대성사고예방 중점관리항목(특수선)', COD: 'D20' },
    { TXT: '중대성사고예방 중점관리항목(해양/플랜트)', COD: 'D30' },
    { TXT: '기타', COD: 'Z' },
    // { TXT: '교통수칙', COD: 'C' },
  ],
  VIO_MDIV: [],
  SHIP_NO: [] //호선
})
//그리드 속성셋팅
const grdMainProps = reactive({

  gridViewOption: { rowIndicator: { visible: false }  },  keys : ['BSNS_NM'],
  fields : [ 
    { fieldName: 'BSNS_NM', dataType: 'text', header: { text: t('사업부') }, editable:false },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서') } , editable:false},
    { fieldName: 'VIO_MDIV',width: '90', dataType: 'text', header: { text: t('No.') } , editable:false},
    { fieldName: 'VIO_GDIV', dataType: 'text' ,header: { text: t('수칙위반 종류') }, lookupDisplay: true,editable:false },
    { fieldName: 'VIO_MDIV_NM', dataType: 'text', header: { text: t('항목명칭') } , lookupDisplay: true, editable:false
    ,groupFooter: {text: "소계 : "}},
    { fieldName: 'IO_DIV_A', dataType: 'number', header: { text: t('직영') }, editable:false
    ,numberFormat: "#,###", footer: { styleName: 'custom_render_span', numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'IO_DIV_B', dataType: 'number', header: { text: t('협력사') }, editable:false
    ,numberFormat: "#,###", footer: { numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'IO_DIV_DZ', dataType: 'number', header: { text: t('기타') }, editable:false
    ,numberFormat: "#,###", footer: { numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"} },
    { fieldName: 'TOT', dataType: 'number', header: { text: t('계') } , editable:false
    ,numberFormat: "#,###", footer: { numberFormat: "#,###",expression: "sum" }, groupFooter: {numberFormat: "#,###",expression: "sum"}},
    { fieldName: 'VIO_PER', dataType: 'text', header: { text: t('점유율') }, editable:false,
    renderer:{
      type:'html',
        callback: function(grid,cell,w,h){
          let result = ''
          if(cell.value !== '' && cell.value !== undefined){
            result =cell.value+' %'
          }
          return result
        }
      } 
    },
    { fieldName: 'VIO_RANK', dataType: 'text', header: { text: t('점유율 등위') }, editable:false },
    { fieldName: 'AVG_EMP', width: '100',dataType: 'text', header: { text: t('평균인원수') }, editable:false },
    { fieldName: 'AVG_PER', dataType: 'text', width: '90', header: { text: t('위반율') }, editable:false
    ,renderer:{
      type:'html',
        callback: function(grid,cell,w,h){
          let result = ''
          if(cell.value !== '' && cell.value !== undefined){
            result =cell.value+' %'
          }
          return result
        }
      }  },
    { fieldName: 'AVG_RANK', dataType: 'text', header: { text: t('위반율 등위') }, editable:false },

    // 숨기는 필드 visible:'false'
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
  ],
  columns : [],
  columnLayout: [
  'BSNS_NM','DEPT_NM','VIO_MDIV','VIO_GDIV','VIO_MDIV_NM',
  {
    name: '위반건수',
    direction: 'horizontal',
    items: [ 'IO_DIV_A','IO_DIV_B','IO_DIV_DZ','TOT' ],
    header: { text: t('위반건수') },
  },
  'VIO_PER','VIO_RANK','AVG_EMP','AVG_PER','AVG_RANK',
  ],
})

grdMainProps.columns = grdMainProps.fields

//그리드 데이터 입력
const data = []

onMounted(() => {
  initCodeList()
  // 사업부, 부서별 조회
  grdMain.value.getGridView().groupBy(["BSNS_NM","DEPT_NM"]) 
  grdMain.value.getGridView().setRowGroup
  ({ 
    expandedAdornments: "footer"  //그룹을 펼쳤을때 FOOTER만 보이기
    //, collapsedAdornments: "footer" //그룹을 접었을때 FOOTER만 보이기
    , mergeExpanderVisibility: "none" //그룹 접기 여부 화면에 안보이게하기
    , mergeMode: true // 행 병합 그룹핑 활성화
    //, indentVisible: false // 행 병합 그룹핑 비활성화일대 사용하면 그룹핑 바 표시 안함.
  })
  const tempList = ['HHIF110B','HHIF110A','HHIF110D10','HHIF110D20','HHIF110D30','HHIF110Z']
  tempList.forEach((e)=>{
    getCodeList(e).then((res) => {
      res.ORESULT_CUR.forEach((t)=>{
        codeList.VIO_MDIV.push(t) 
      })
    })
  })
  console.log('codeList.VIO_MDIV',codeList.VIO_MDIV)

})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === "btnSearch") {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}
const afterSearch = (res) => {
  // console.log('search Result',res)
  let tempList = []
  let tempDeptList = []
  let searchData = res.ORESULT_CUR
  let result = []
  console.log('searchData',searchData)
  // 조회된 사업부 목록
  searchData.forEach(element => {
    if (!tempList.includes(element.BSNS_CD)) {
      tempList.push(element.BSNS_CD);
    }
  })
  searchData.forEach(element => {
    if (!tempDeptList.includes(element.DEPT_CD)) {
      tempDeptList.push(element.DEPT_CD);
    }
  })
  // console.log('tempList',tempList)

  grdMain.value.setBindingColumn("VIO_GDIV", codeList.VIO_GDIVList, "COD", "TXT")
  grdMain.value.setBindingColumn("VIO_MDIV_NM", codeList.VIO_MDIV, "COD", "TXT")


  // 점유율 계산
  tempList.forEach((t)=>{
    let tot = 0
    searchData.forEach(e => {
      if(t===e.BSNS_CD){
        tot += parseInt(e.TOT) 
      }
    })
    searchData.forEach((e) => {
      if(t===e.BSNS_CD){
        e.VIO_PER = ((e.TOT / tot) * 100).toFixed(1)
      }
    })
  })

  // 점유율 순위 적용
  tempList.forEach((t)=>{
    // 사업부별 데이터
    let rankList = []
    searchData.forEach(e => {
      if(t===e.BSNS_CD){
        rankList.push(e)
      }
    })
    // TOT 값을 기준으로 내림차순으로 정렬
    rankList.sort((a, b) => b.TOT - a.TOT)

    // 순위 부여
    let rank = 1
    // 이전순번 데이터
    let prevTOT = null

    rankList.forEach((item, index) => {
        if (item.TOT !== prevTOT) {
          item.VIO_RANK = rank + ' 위'
        }
        else {
          rank--
            item.VIO_RANK = rank + ' 위'
        }
        rank++
        prevTOT = item.TOT
    });
    rankList.forEach((item, index) => {
        result.push(item)
    });
  })

  // 위반율 순위 적용
  tempDeptList.forEach((t)=>{
    // 부서별 데이터
    let rankList = []
    searchData.forEach(e => {
      if(t===e.DEPT_CD){
        rankList.push(e)
      }
    })
    // TOT 값을 기준으로 내림차순으로 정렬
    rankList.sort((a, b) => b.TOT - a.TOT)

    // 순위 부여
    let rank = 1
    // 이전순번 데이터
    let prevTOT = null

    result.forEach((item, index) => {
        if (item.TOT !== prevTOT) {
          item.AVG_RANK = rank + ' 위'          
        }
        else {
          rank--
          item.AVG_RANK = rank + ' 위'
        }
        rank++
        prevTOT = item.TOT
    });

  })

  // console.log(searchData)
  grdMain.value.getDataProvider().setRows(result)
  
}
//조회 코드
const searchData = () => {
  return commonSearchApi({
    queryId: "SAFDB0010_SEARCH_01",
    param: searchParams,
  })
}
const initCodeList = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    USE_DIV: 'N',
  }

  // 사업부 리스트 조회
  Promise.all([ commonSearchApi({ queryId : 'searchBSNS', param }),
      commonSearchApi({ queryId : 'MNG_searchCommonCode',
       param: { CMPNY_DIV: userStore.cmpnyDiv,
         ALL_UP_CD: 'HHIZ000', USE_FLAG: 'Y' } }),
     commonSearchApi({ queryId: 'SAFCD0010_SEARCH81', param: {} }),
      ]).then(res => {
    codeList.BSNSList = res[0].ORESULT_CUR
    codeList.CMPNY_List = res[1].ORESULT_CUR
    codeList.BSNSList.unshift({ BSNS_NM:'전체', BSNS_CD: '' })
    codeList.CMPNY_List.unshift({ TXT:'전체', COD: '' })
    codeList.SHIP_NO = res[2].ORESULT_CUR
    codeList.SHIP_NO.unshift({ TXT: '전체', COD: '' })
    // console.log(res)
    bsnsCdChange(searchParams.BSNS_CD)
  })
}
const bsnsCdChange = e => {
  codeList.DEPTList = []
  Promise.all([commonSearchApi({ queryId : 'searchDept',
   param: { CMPNY_DIV: userStore.cmpnyDiv,
     ORGN_DIV: 'A', BSNS_CD: e, 
     USE_ONLY: 'Y' } 
    })
  ]).then(res => {
    // console.log(res)
    codeList.DEPTList = res[0].ORESULT_CUR
    codeList.DEPTList.unshift({ ASGN_SHRT_NM:'전체', DEPT_CD: '' })
    searchParams.DEPT_CD = ''
  }) 
  // reset()
}
/* 그리드 및 상세정보 초기화 */
// const reset = () => {
  // grdMain.value.getDataProvider().setRows([])
  // for(let i in searchParams){
  //   searchParams[i] = ''
  // }
  // setBtn()
// }

// BSNS_CD(사업 코드) 별로 순위를 매기는 함수
function assignRanking(sorted) {
    var ranking = {}; // 결과를 저장할 객체 생성
    var rank = 1; // 초기 순위는 1로 설정

    // 정렬된 배열을 순회하며 각 사업 코드에 대한 순위를 할당
    sorted.forEach(function(item) {
        var bsnsCode = item[0]; // 사업 코드
        ranking[bsnsCode] = rank; // 순위 할당
        rank++; // 다음 순위로 업데이트
    });

    return ranking;
}
</script>

<template>
  
    
      <v-card class="pa-0 fill-height">
        <v-card-title class="pa-3 pb-0">
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch']"
            @click-button="onButtonsClick"
          />
        </v-card-title>
        <!-- 조회조건 -->
        <v-card-text class="pa-3 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <v-sheet class="searchArea flex-column">
              <div style="display: flex; justify-content: space-around;
              padding-bottom: 6px;">
                <i-select 
                :label="$t('사업부')"
                label-width="50px"
                width="250px"
                :items="codeList.BSNSList"
                item-title="BSNS_NM"
                item-value="BSNS_CD"
                v-model="searchParams.BSNS_CD"
                @update:modelValue="bsnsCdChange"
                />
                <i-select 
                :label="$t('부서')"
                label-width="35px"
                width="250px"
                :items="codeList.DEPTList"
                item-title="ASGN_SHRT_NM"
                item-value="DEPT_CD"
                v-model="searchParams.DEPT_CD"
                />
                <div class="d-flex">
                  <div class="d-flex align-center">
                    <VCheckbox 
                      v-model="searchParams.DATE_YN"
                      true-value="Y" false-value="N"
                    />
                  </div>
                  <i-input 
                    v-model="searchParams.VIO_DATE_FR"
                    :label="$t('일별')"
                    label-width="58px" 
                    width="220px"
                    type="date"
                    class="mr-2"
                    justify="center"
                    marginBetween="19px"
                  />
                  <i-input 
                    v-model="searchParams.VIO_DATE_TO"
                    width="170px" 
                    :label="$t('~')" 
                    type="date"
                  />
                </div>
                <div class="d-flex align-center">
                  <ILabel :label="$t('조직구분')">
                    <template #editor="editorProps">
                      <VRadioGroup
                        v-model="searchParams.IO_DIV"
                        inline
                      >
                        <VRadio
                          v-for="(item , i) in codeList.IO_DIVList"
                          :key="i"
                          :value="item.value"
                          :label="item.label"
                        />
                      </VRadioGroup>
                    </template>
                  </ILabel>
                </div>
                <div class="d-flex align-center">
                  <ILabel :label="$t('생산 / 비생산')">
                    <template #editor="editorProps">
                      <VRadioGroup
                        v-model="searchParams.PROD_DIV"
                        inline
                      >
                        <VRadio
                          v-for="(item , i) in codeList.PROD_DIVList"
                          :key="i"
                          :value="item.value"
                          :label="item.label"
                        />
                      </VRadioGroup>
                    </template>
                  </ILabel>
                </div>
              </div>
              <div style="display: flex;">
                <div class="d-flex" style="width: 50%; justify-content: flex-end;">
                  <div class="d-flex align-center">
                    <VCheckbox 
                      v-model="searchParams.DATE_YN"
                      true-value="N" false-value="Y"
                    />
                  </div>
                  <i-select 
                    v-model="searchParams.VIO_YEAR"
                    :label="$t('년도별')"
                    label-width="60px" 
                    width="215px"
                    type="YEAR"
                    justify="center"
                    marginBetween="12px"
                    style="margin-left: 5px"
                  />
                </div>
                <div class="d-flex" style="width: 30%;justify-content: flex-end; margin-left: 10px;">
                <i-select 
                  :label="$t('구분')"
                  label-width="35px"
                  width="300px"
                  :items="codeList.VIO_GDIVList"
                  item-title="TXT"
                  item-value="COD"
                  v-model="searchParams.VIO_GDIV"
                />
                <i-select 
                  v-model="searchParams.SHIP_NO"
                  :label="$t('호선/프로젝트')"
                  label-width="80px"
                  width="200px"
                  :items="codeList.SHIP_NO"
                  item-value="COD"
                  item-title="TXT"
                />
                </div>
              </div>
            </v-sheet>
          
        <!-- 메인그리드 -->
        <v-sheet height="100%">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
            />
          </v-sheet>
        </div>
        </v-card-text>
      </v-card>
      
  
</template>
  
<style scoped lang="scss">
.custom-footer{
  align-items: center;
}
.rg-rowgroup-footer-cell .rg-rowgroup-footer-renderer {
    padding: 0 4px;
    text-align: center !important;
    display: flex !important;
    justify-content: center !important;
 }
 .content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>