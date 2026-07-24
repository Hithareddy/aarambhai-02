import requests
import sys
import json

base_url = 'http://127.0.0.1:8000'

try:
    print('Testing Assessment System Seed Accuracy...')
    res = requests.get(f'{base_url}/api/v1/assessments/questions?subject=English&testType=diagnostic')
    if res.status_code != 200:
        print(f'Failed to get questions: {res.text}')
        sys.exit(1)
        
    data = res.json()
    questions = data.get('questions', [])
    print(f'Retrieved {len(questions)} diagnostic questions.')
    
    # Audit question types
    types = {}
    for q in questions:
        q_type = q['question_content'].get('question_type', 'unknown')
        types[q_type] = types.get(q_type, 0) + 1
        
        # Verify ImageMCQ
        if q_type == 'image_mcq':
            img = q['question_content'].get('image_url')
            if not img or 'wikimedia' in img:
                print(f'FAIL: ImageMCQ {q["id"]} has invalid image: {img}')
            else:
                print(f'PASS: ImageMCQ valid local asset -> {img}')
                
        # Verify Arrange
        if q_type == 'arrange':
            options = q['options']
            is_valid = True
            for opt in options:
                if ' ' in opt['text']:
                    is_valid = False
            if not is_valid:
                print(f'FAIL: Arrange {q["id"]} contains raw sentence chunks!')
            else:
                print(f'PASS: Arrange {q["id"]} contains only word-level chips.')
    
    print('\nQuestion Type Audit Matrix:')
    print(json.dumps(types, indent=2))
    print('\nE2E Database Content Validation Complete!')
except Exception as e:
    print('Error:', e)
