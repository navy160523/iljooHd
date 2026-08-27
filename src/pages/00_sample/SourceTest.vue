<template>
  <div class="accident-report-wizard">
    <div class="wizard-title-section">
      <h2>사고 보고서 생성기</h2>
      <p>AI 어시스턴트와 함께 보고서를 작성해보세요</p>
    </div>

    <div class="content-input-zone">
      <div class="input-card">
        <label for="accident-content">사고 내용</label>
        <div class="textarea-container">
          <div class="textarea-with-button">
            <textarea 
              id="accident-content"
              v-model="inputText" 
              placeholder="발생한 사고의 간략한 내용을 입력해주세요.&#10;예: 25년 8월 25일 09시 1도크 디지털혁신기획부 한민규 낙상사고 작업자부주의 " 
              rows="8"
              :disabled="isLoading"
            ></textarea>
            <button 
              class="ai-polish-button"
              @click="polishContent"
              :disabled="isLoading"
            >
              <span v-if="!isLoading" class="button-text">
                <i class="fas fa-magic"></i>
                AI 어시스턴트
              </span>
              <span v-else class="button-text">
                <i class="fas fa-spinner fa-spin"></i>
                처리중...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>


    <div v-if="report" class="result-display">
      <div class="result-header">
        <h3><i class="fas fa-clipboard-list"></i> 생성된 보고서</h3>
        <button class="copy-button" @click="copyReport">
          <i class="fas fa-copy"></i>
          복사
        </button>
      </div>
      <div class="report-text-area">
        <pre>{{ report }}</pre>
      </div>
    </div>

    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from "axios";
import { commonLLMservice } from '@hiway/api/commonApi'

const inputText = ref('');
const report = ref('');
const error = ref('');
const isLoading = ref(false);

// AI 어시스턴트로 내용 다듬기
const polishContent = async () => {
  if (!inputText.value.trim()) return;
  
  isLoading.value = true;
  error.value = '';

  try {
    // 임시 API 호출 (실제로는 commonLLMservice 사용)
    const response = await mockPolishAPI(inputText.value);
    console.log("polishContent response", response)
    inputText.value = response.polishedContent;
  } catch (err) {
    console.error('AI 어시스턴트 오류:', err);
    error.value = 'AI 어시스턴트 처리 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

// AI API 함수
const mockPolishAPI = async (content) => {
  try {
    const data = {
        question: `아래 글을 공식적인 어투의 보고서형태로 바꿔줘. 없는 내용은 만들지말고 답변은 최종질문 없이 다듬어진 내용만 보내줘. 아래 글: ${content}`,
      }
   
    const res = await commonLLMservice(data);

    // API 응답에서 <think> 태그 이후의 텍스트만 추출
    let polishedContent = content; // 기본값은 원본 텍스트
    
    if (res.statusCode == 200) {
      const responseText = res.responseBody;
      const thinkIndex = responseText.indexOf('</think>');

      if (thinkIndex !== -1) {
        // </think> 태그 이후의 텍스트 추출
        polishedContent = responseText.substring(thinkIndex + 8).trim();
      } else {
        // <think> 태그가 없으면 전체 응답 사용
        polishedContent = responseText;
      }
    }

    return { polishedContent: polishedContent };
  } catch (error) {
    console.error('AI API 오류:', error);
    throw error;
  }
};

const generateReport = async () => {
  if (!inputText.value.trim()) return;
  
  report.value = '';
  error.value = '';
  isLoading.value = true;

  try {
    let param = {
      text: inputText.value
    };
    
    const res = await commonLLMservice(param);
    console.log("res", res);
    
    // 임시로 응답 데이터가 없을 경우를 대비한 처리
    report.value = res.data?.report || `사고 보고서\n\n${inputText.value}\n\n(보고서 생성 완료)`;
  } catch (err) {
    console.error(err);
    error.value = '보고서 생성 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const copyReport = async () => {
  try {
    await navigator.clipboard.writeText(report.value);
    // 복사 성공 알림 (실제로는 토스트나 알림 컴포넌트 사용)
    alert('보고서가 클립보드에 복사되었습니다.');
  } catch (err) {
    console.error('복사 실패:', err);
    error.value = '복사에 실패했습니다.';
  }
};
</script>

<style scoped>
.accident-report-wizard {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  width: 100%;
}

.wizard-title-section {
  width: 100%;
  background: #ffffff;
  margin-bottom: 2rem;
  text-align: center;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
}

.wizard-title-section h2 {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.wizard-title-section p {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0;
}

.content-input-zone {
  margin-bottom: 2rem;
}

.input-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  width: 100%;
  box-sizing: border-box;
}

.input-card label {
  display: block;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.textarea-container {
  position: relative;
}

.textarea-with-button {
  position: relative;
  display: inline-block;
  width: 100%;
}

textarea {
  width: 100%;
  padding: 1rem 10rem 1rem 1rem;
  border: 3px solid #e1e8ed;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.7;
  resize: vertical;
  min-height: 220px;
  font-family: inherit;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background: #fafbfc;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  background: white;
}

textarea:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.ai-polish-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  z-index: 10;
  min-width: 120px;
  pointer-events: auto;
}

.ai-polish-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

.ai-polish-button:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
}

.button-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-zone {
  text-align: center;
  margin-bottom: 2rem;
}

.generate-report-button {
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1.2rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.generate-report-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(78, 205, 196, 0.4);
}

.generate-report-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.result-display {
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  margin-top: 2rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid #f8f9fa;
}

.result-header h3 {
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-button {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.copy-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.report-text-area {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  padding: 1.5rem;
  border: 2px solid #e9ecef;
}

.report-text-area pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1rem;
  line-height: 1.7;
  color: #2c3e50;
}

.error-message {
  background: linear-gradient(135deg, #fee 0%, #fadbd8 100%);
  color: #c0392b;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid #fadbd8;
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(192, 57, 43, 0.1);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .accident-report-wizard {
    padding: 1rem;
  }
  
  .wizard-title-section {
    width: 100%;
  }
  
  .wizard-title-section h2 {
    font-size: 1.8rem;
  }
  
  .ai-polish-button {
    position: static;
    margin-top: 1rem;
    width: 100%;
    justify-content: center;
  }
  
  .result-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .copy-button {
    align-self: flex-end;
  }
}

/* 로딩 애니메이션 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fa-spin {
  animation: spin 1s linear infinite;
}
</style>
