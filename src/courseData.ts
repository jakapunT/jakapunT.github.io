export type Course = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string[];
  progression: string;
  topics: { title: string; items: string[] }[];
};

export const courses: Course[] = [
  {
    slug: 'basic-programming-nlp',
    title: 'Basic Programming for Natural Language Processing',
    shortDescription: 'Python, computational thinking, and practical foundations for working with language data.',
    description: [
      'This course introduces programming through the lens of language and text data. It develops the computational thinking and practical Python skills needed for later study in Natural Language Processing, computational linguistics, data science, and language technology.',
      'Students begin with the fundamental idea of programming: writing precise instructions that allow a computer to perform a task. They learn how programming languages differ from natural languages, how Python programs are structured and executed, and how to work in Visual Studio Code and Jupyter Notebook.',
      'Programming is connected directly to language-processing problems. Students manipulate textual and numerical data, obtain data from online sources, and prepare real-world text through tokenization, normalization, stemming, lemmatization, and noise removal.',
      'Laboratory activities and assignments emphasize breaking problems into computational steps, translating those steps into code, testing solutions, and using programming to investigate language data. The course also introduces how processed text later supports embeddings, recurrent neural networks, and Transformers.',
    ],
    progression: 'From “I have never programmed before” to “I can use Python to solve problems involving language and text.”',
    topics: [
      { title: 'Introduction to Programming', items: ['How computers execute instructions', 'Programming languages versus natural languages', 'Python interpreters and development environments', '.py programs and Jupyter notebooks'] },
      { title: 'Python Fundamentals', items: ['Program structure and sequential execution', 'Variables and expressions', 'Functions and modules', 'Reusable code and basic program organisation'] },
      { title: 'Computational Problem Solving', items: ['Breaking complex tasks into smaller steps', 'Translating problems into algorithms', 'Reading, debugging, and modifying programs', 'Developing structured programming habits'] },
      { title: 'Working with Language and Data', items: ['Processing textual and numerical data', 'Representing linguistic information', 'Preparing raw text for computational analysis'] },
      { title: 'Text Preprocessing', items: ['Tokenization', 'Normalization', 'Stemming and lemmatization', 'Noise removal and downstream preparation'] },
      { title: 'Programming for NLP', items: ['Python as a foundation for NLP', 'NLP-oriented libraries and tools', 'Obtaining data from online sources', 'Applying fundamental NLP techniques to real text'] },
      { title: 'Introduction to NLP Model Development', items: ['From processed text to computational models', 'Conceptual introduction to embeddings', 'Neural models, RNNs, and Transformers'] },
    ],
  },
  {
    slug: 'natural-language-processing',
    title: 'Natural Language Processing',
    shortDescription: 'How computers analyze, understand, retrieve, classify, and generate human language.',
    description: [
      'Natural Language Processing explores how computers can analyze, understand, retrieve, classify, and generate human language. The course combines linguistics, computer science, and machine learning, focusing on both computational methods and the linguistic properties that make language difficult to process automatically.',
      'Students move beyond using existing AI applications and investigate how language technologies work internally. They progress from foundational machine-learning concepts to logistic regression, word embeddings, neural networks, language models, and Transformers.',
      'These methods are connected to applications including sentiment analysis, predictive text, named-entity recognition, information retrieval, and machine translation. Practical work uses scikit-learn, PyTorch, and Hugging Face, while programming assignments include logistic regression, a small retrieval system, and a domain-specific RAG chatbot.',
      'The goal is to understand how language is represented computationally, how models learn from data, how different approaches solve different language problems, and how linguistic knowledge guides development and evaluation.',
    ],
    progression: 'Language → Representation → Model → Prediction / Retrieval / Generation → Linguistic Analysis',
    topics: [
      { title: 'Foundations of NLP', items: ['What NLP is', 'NLP versus computational linguistics', 'AI, NLP, and Large Language Models', 'Linguistic challenges in computational systems'] },
      { title: 'Machine Learning & Text Classification', items: ['Features and representations', 'Classification and logistic regression', 'Sentiment analysis', 'Training and evaluating NLP models'] },
      { title: 'Word Representation', items: ['Representing language numerically', 'Word embeddings', 'Learned vector representations'] },
      { title: 'Language Modeling', items: ['Modeling language sequences', 'Predicting words or tokens', 'Probability-based and neural language models'] },
      { title: 'Information Retrieval', items: ['Representing documents and queries', 'Measuring relevance', 'Search systems and document retrieval'] },
      { title: 'Neural NLP & Understanding', items: ['Neural networks for language', 'Contextual and Transformer-based representations', 'Named-entity recognition and linguistic analysis'] },
      { title: 'Generation & Modern Applications', items: ['Generative language models', 'Machine translation', 'Hugging Face models', 'Retrieval-Augmented Generation and domain-specific applications'] },
    ],
  },
  {
    slug: 'large-language-models',
    title: 'Large Language Models',
    shortDescription: 'Foundations, architectures, training, alignment, inference, and applications of modern generative AI.',
    description: [
      'This advanced course examines the foundations, architectures, training methods, and applications behind modern generative AI. It moves beyond using systems such as ChatGPT as black boxes and investigates how language models are constructed, trained, adapted, aligned, evaluated, and incorporated into larger AI systems.',
      'Students trace language modeling from n-grams and Hidden Markov Models through Word2Vec, attention, Transformers, and pretrained models. They study BERT, GPT, and LLaMA alongside modern components such as RMS normalization, rotary positional embeddings, key-value caching, Flash Attention, and Mixture-of-Experts architectures.',
      'The course follows the training pipeline from pretraining through supervised and parameter-efficient fine-tuning to preference alignment. Topics include LoRA, RLHF, PPO, DPO, GRPO, quantization, decoding strategies, and efficient deployment.',
      'Later work moves from individual models to LLM-powered systems: prompting, hallucination, RAG, tool use, agents, multimodal models, and diffusion systems. Assignments cover fine-tuning and RAG, culminating in a research- or application-oriented capstone project.',
    ],
    progression: 'Language Modeling → Transformer → Pretraining → Fine-Tuning → Alignment → Inference → RAG / Agents → LLM Applications',
    topics: [
      { title: 'Language Modeling Foundations', items: ['Statistical and neural language models', 'N-grams and sequence probability', 'Next-token prediction'] },
      { title: 'Evolution & Architecture', items: ['Word2Vec and attention', 'Transformers, BERT, GPT, and LLaMA', 'RoPE, RMS normalization, and KV cache'] },
      { title: 'Inference, Scaling & Efficiency', items: ['Greedy decoding and beam search', 'Flash Attention', 'Mixture of Experts', 'Quantization and efficient deployment'] },
      { title: 'Pretraining & Fine-Tuning', items: ['Data pipelines and pretraining objectives', 'Supervised and full fine-tuning', 'Parameter-Efficient Fine-Tuning and LoRA'] },
      { title: 'LLM Alignment', items: ['Preference data', 'RLHF and reward-based alignment', 'PPO, DPO, and GRPO'] },
      { title: 'Prompting & Model Behaviour', items: ['Zero-shot and few-shot prompting', 'Reasoning-oriented prompting', 'Hallucination and limitations'] },
      { title: 'RAG, Agents & Emerging AI', items: ['External knowledge retrieval and LangChain', 'Tool use and agentic workflows', 'Multimodal language models', 'Diffusion models and future directions'] },
    ],
  },
  {
    slug: 'statistics-digital-humanities',
    title: 'Statistics for Digital Humanities',
    shortDescription: 'Statistical thinking and quantitative methods for language, text, culture, and humanities data.',
    description: [
      'This course introduces statistical thinking and quantitative methods for research involving language, texts, culture, and other humanities data. It connects Statistics, Digital Humanities, and Computational Linguistics, showing how quantitative methods can turn observations into measurable evidence while preserving meaningful interpretation.',
      'Students learn to analyze, visualize, and transform humanities data in Python. Foundations include data types, descriptive statistics, visualization, probability, sampling, probability distributions, and the Central Limit Theorem.',
      'The course then introduces statistical inference, confidence intervals, hypothesis testing, t-tests, chi-square tests, and ANOVA before moving to correlation, linear regression, multiple regression, and logistic regression. Model interpretation, confounding variables, prediction, cross-validation, ROC/AUC, and overfitting connect classical statistics with predictive modeling.',
      'Advanced topics include Maximum Likelihood Estimation, information theory, Monte Carlo methods, bootstrapping, permutation tests, and Cohen’s Kappa. Throughout, students connect research questions, data, assumptions, methods, results, and interpretation while avoiding p-hacking and confusing correlation with causation.',
    ],
    progression: 'Describe Data → Understand Uncertainty → Test Claims → Model Relationships → Evaluate Evidence',
    topics: [
      { title: 'Humanities Data & Python', items: ['Digital Humanities and Computational Linguistics', 'Quantitative text research', 'NumPy, Pandas, and visualization tools', 'Working with real humanities datasets'] },
      { title: 'Descriptive Statistics & Visualization', items: ['Variables, mean, median, and mode', 'Percentiles, variance, and standard deviation', 'Histograms, density plots, scatter plots, box plots, and CDFs'] },
      { title: 'Probability & Statistical Inference', items: ['Random variables and distributions', 'Sampling and the Central Limit Theorem', 'Confidence intervals and statistical uncertainty'] },
      { title: 'Hypothesis Testing & Group Comparison', items: ['Null and alternative hypotheses', 'p-values and significance', 'One- and two-sample t-tests', 'Chi-square tests, ANOVA, and post-hoc comparisons'] },
      { title: 'Regression & Classification', items: ['Pearson correlation', 'Simple and multiple linear regression', 'Logistic regression', 'Coefficient and assumption interpretation'] },
      { title: 'Model Evaluation', items: ['Confusion matrices', 'ROC and AUC', 'Cross-validation', 'Overfitting and model selection'] },
      { title: 'Advanced & Responsible Methods', items: ['Maximum Likelihood Estimation and information theory', 'Monte Carlo simulation', 'Bootstrapping and permutation tests', 'Cohen’s Kappa, p-hacking, and correlation versus causation'] },
    ],
  },
];

export const findCourse = (slug: string | null) => courses.find((course) => course.slug === slug);
