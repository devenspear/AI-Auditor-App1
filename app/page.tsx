"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chart, RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import type { SubmissionData } from '@/lib/report-types';

// Register Chart.js components
Chart.register(RadarController, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function AIAuditor() {
  const router = useRouter();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-section-index') || '0');
            setVisibleSections(prev => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[data-section-index]');
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy existing chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: ['Technical SEO', 'Backlink Profile', 'Content Keywords', ['Brand Voice', 'Clarity'], ['GEO', 'Readiness'], ['Strategic', 'Narrative']],
            datasets: [{
              label: 'Traditional Audit Tools',
              data: [85, 80, 75, 10, 20, 15],
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(239, 68, 68, 1)',
            }, {
              label: 'AI Auditor',
              data: [80, 70, 75, 90, 85, 95],
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            }]
          },
          options: {
            maintainAspectRatio: false,
            scales: {
              r: {
                angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                grid: { color: 'rgba(0, 0, 0, 0.1)' },
                pointLabels: {
                  font: {
                    size: 12,
                    weight: 'bold'
                  },
                  color: '#334155'
                },
                ticks: {
                  backdropColor: 'rgba(255, 255, 255, 0.75)',
                  color: '#475569'
                },
                suggestedMin: 0,
                suggestedMax: 100
              }
            },
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  title: function (tooltipItems) {
                    const item = tooltipItems[0];
                    let label = item.chart.data.labels?.[item.dataIndex];
                    if (Array.isArray(label)) {
                      return label.join(' ');
                    } else {
                      return label as string;
                    }
                  }
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Generate unique submission ID
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract form data
    const submissionData: SubmissionData = {
      // Contact Information
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,

      // Company Information
      companyName: formData.get('companyName') as string,
      companyUrl: formData.get('companyUrl') as string,
      industry: formData.get('industry') as string || undefined,
      companySize: formData.get('companySize') as string || undefined,
      jobTitle: formData.get('jobTitle') as string || undefined,

      // Business Context
      productDescription: formData.get('productDescription') as string || undefined,
      challenges: formData.get('challenges') as string || undefined,
      competitors: formData.get('competitors') as string || undefined,
      marketingGoals: formData.get('marketingGoals') as string || undefined,
      timeline: formData.get('timeline') as string || undefined,
      additionalInfo: formData.get('additionalInfo') as string || undefined,

      // Metadata
      submittedAt: new Date().toISOString(),
      submissionId,
    };

    try {
      // Call the analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: submissionData.companyUrl,
          submissionData,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      // Navigate to report page with submission ID
      router.push(`/report?id=${submissionId}`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-700">
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center my-8 md:my-12">
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-blue-500 to-slate-600 bg-clip-text text-transparent pb-1">The AI Revolution in Marketing</h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-slate-600">A new era is dawning. Brands are no longer defined by what they say, but by how AI understands them. This is the playbook for navigating the next five years.</p>
        </header>

        <section className="my-16 transition-all duration-700 opacity-0 translate-y-8" data-section-index="0" style={{opacity: visibleSections.has(0) ? 1 : 0, transform: visibleSections.has(0) ? 'translateY(0)' : 'translateY(2rem)'}}>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">The Market Shift is Undeniable</h2>
            <p className="mt-2 text-slate-600 max-w-2xl mx-auto">AI is moving from a marketing tool to the marketing ecosystem itself. The growth is explosive and the stakes are high.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 transform hover:scale-105">
              <p className="text-6xl font-black text-blue-600">$107.5B</p>
              <p className="mt-2 font-bold text-slate-800 text-lg">AI in Marketing Market Size by 2028</p>
              <p className="mt-1 text-slate-500">A meteoric rise from just $15.8B in 2021, signaling a fundamental industry transformation.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 transform hover:scale-105 delay-75">
              <p className="text-6xl font-black text-amber-500">80%</p>
              <p className="mt-2 font-bold text-slate-800 text-lg">Enterprises Using GenAI by 2026</p>
              <p className="mt-1 text-slate-500">According to Gartner, AI is on the fastest adoption curve of any technology in history.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 transform hover:scale-105 delay-150">
              <p className="text-6xl font-black text-rose-500">50%</p>
              <p className="mt-2 font-bold text-slate-800 text-lg">Business Decisions Driven by AI by 2027</p>
              <p className="mt-1 text-slate-500">AI agents will move from task automation to strategic decision-making, changing marketing forever.</p>
            </div>
          </div>
        </section>

        <section className="my-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">The Old Playbook is Obsolete</h2>
            <p className="mt-2 text-slate-600 max-w-2xl mx-auto">Traditional digital marketing audits are missing the most critical new signals. Brands are flying blind in the new AI landscape, creating a massive opportunity.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-bold text-2xl text-slate-800 mb-4">What Existing Tools See vs. What AI Sees</h3>
                <p className="mb-6 text-slate-600">Standard SEO tools are great at analyzing technical factors, but they are blind to the subjective, brand-level attributes that AI prioritizes. This is the critical &quot;Clarity Gap&quot; where most brands fail.</p>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="font-semibold text-red-800">❌ Brand Voice & Tone Consistency</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="font-semibold text-red-800">❌ Generative Engine Optimization (GEO) Readiness</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="font-semibold text-red-800">❌ Strategic Content & Brand Narrative</p>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-md mx-auto h-80 md:h-96">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          </div>
        </section>

        <section className="my-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">The AI Blind Spots in Traditional Marketing</h2>
            <p className="mt-2 text-slate-600 max-w-3xl mx-auto">While brands optimize for clicks and keywords, a new, more powerful audience is judging them: the AI itself. Failing to optimize for this audience is the single biggest threat to brand visibility in the next decade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-2 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">The Problem: Brand Meaning is Lost</h3>
              </div>
              <p className="text-slate-600">AI doesn&apos;t see your clever logo or beautiful design. It reads your text. If your brand voice is inconsistent, your messaging unclear, and your value proposition buried, the AI will categorize your brand as low-quality or irrelevant. For AI, <strong className="text-slate-800">clarity is a proxy for authority.</strong></p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">The Solution: Engineer for AI Perception</h3>
              </div>
              <p className="text-slate-600">Brands must proactively engineer their digital presence to be perfectly legible to AI. This means creating a <strong className="text-slate-800">unified brand narrative,</strong> structuring content to directly answer questions, and using technical signals (like schema) to state facts, not hints. This is the foundation of Generative Engine Optimization (GEO).</p>
            </div>
          </div>
        </section>

        <section className="my-20 bg-gradient-to-br from-slate-100 via-slate-50 to-white rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200 transition-all duration-700" data-section-index="3" style={{opacity: visibleSections.has(3) ? 1 : 0, transform: visibleSections.has(3) ? 'translateY(0)' : 'translateY(2rem)'}}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">The Solution: AI Auditor</h2>
            <p className="mt-2 text-slate-600 max-w-3xl mx-auto">We don&apos;t just find problems; we deliver a complete strategic framework. Our platform is built on three core analytical pillars that provide a 360-degree view of a brand&apos;s AI readiness.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pillar 1: AI Brand Clarity */}
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg flex flex-col hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="text-5xl mb-4">📈</div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">AI Brand Clarity</h3>
                <p className="text-slate-600 mb-6 flex-grow">How consistently and clearly does AI understand your brand&apos;s core identity and value proposition?</p>
              </div>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <h4 className="font-semibold text-slate-700 mb-2">What we analyze:</h4>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>Voice & Tone Consistency</li>
                  <li>Readability Scores</li>
                  <li>Sentiment Analysis</li>
                  <li>Value Proposition Prominence</li>
                </ul>
              </div>
            </div>
            {/* Pillar 2: GEO Readiness */}
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg flex flex-col hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="text-5xl mb-4">🔎</div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">GEO Readiness</h3>
                <p className="text-slate-600 mb-6 flex-grow">Is your website structured to be a trusted source for AI-powered search and answer engines?</p>
              </div>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <h4 className="font-semibold text-slate-700 mb-2">What we analyze:</h4>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>Schema & Structured Data</li>
                  <li>&quot;Answer-Engine&quot; Content Format</li>
                  <li>Topical Authority & Content Hubs</li>
                  <li>Internal Linking Strategy</li>
                </ul>
              </div>
            </div>
            {/* Pillar 3: Actionable AI Roadmap */}
            <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-lg flex flex-col hover:shadow-xl transition-shadow">
              <div className="text-center">
                <div className="text-5xl mb-4">🗺️</div>
                <h3 className="text-xl font-bold mb-2 text-slate-800">Actionable AI Roadmap</h3>
                <p className="text-slate-600 mb-6 flex-grow">We translate complex data into a prioritized, step-by-step plan for execution and success.</p>
              </div>
              <div className="border-t border-slate-200 pt-4 mt-auto">
                <h4 className="font-semibold text-slate-700 mb-2">What we deliver:</h4>
                <ul className="list-disc list-inside text-slate-600 text-sm space-y-1">
                  <li>Prioritized Task List</li>
                  <li>Effort vs. Impact Scoring</li>
                  <li>Strategic Recommendations</li>
                  <li>Benchmark Goals</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Interest Form Section */}
        <section className="my-20 transition-all duration-700" data-section-index="7" style={{opacity: visibleSections.has(7) ? 1 : 0, transform: visibleSections.has(7) ? 'translateY(0)' : 'translateY(2rem)'}}>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">Get Your Free AI Readiness Assessment</h2>
            <p className="mt-2 text-slate-600 max-w-3xl mx-auto">Join forward-thinking brands who are already preparing for the AI-powered future. Fill out the form below and we&apos;ll provide you with a comprehensive evaluation of your digital presence.</p>
          </div>
          <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 rounded-2xl shadow-xl p-8 md:p-12 border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">
                      First Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">
                      Last Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="Smith"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="john.smith@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Company Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-semibold text-slate-700 mb-2">
                      Company Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <label htmlFor="companyUrl" className="block text-sm font-semibold text-slate-700 mb-2">
                      Company Website <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="url"
                      id="companyUrl"
                      name="companyUrl"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="https://www.example.com"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="industry" className="block text-sm font-semibold text-slate-700 mb-2">
                        Industry
                      </label>
                      <select
                        id="industry"
                        name="industry"
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 transition-all duration-200"
                      >
                        <option value="">Select an industry</option>
                        <option value="technology">Technology & Software</option>
                        <option value="ecommerce">E-Commerce & Retail</option>
                        <option value="healthcare">Healthcare & Medical</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="education">Education & Training</option>
                        <option value="realestate">Real Estate</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="professional">Professional Services</option>
                        <option value="hospitality">Hospitality & Travel</option>
                        <option value="nonprofit">Nonprofit & Government</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="companySize" className="block text-sm font-semibold text-slate-700 mb-2">
                        Company Size
                      </label>
                      <select
                        id="companySize"
                        name="companySize"
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 transition-all duration-200"
                      >
                        <option value="">Select company size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1001+">1001+ employees</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-semibold text-slate-700 mb-2">
                      Your Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="Marketing Director"
                    />
                  </div>
                </div>
              </div>

              {/* Business Context */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Tell Us About Your Business (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="productDescription" className="block text-sm font-semibold text-slate-700 mb-2">
                      Products/Services & Value Proposition
                    </label>
                    <textarea
                      id="productDescription"
                      name="productDescription"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200 resize-none"
                      placeholder="Briefly describe what your company offers and what makes you unique..."
                    />
                  </div>
                  <div>
                    <label htmlFor="challenges" className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Marketing Challenges
                    </label>
                    <textarea
                      id="challenges"
                      name="challenges"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200 resize-none"
                      placeholder="What are your biggest marketing challenges or pain points?"
                    />
                  </div>
                  <div>
                    <label htmlFor="competitors" className="block text-sm font-semibold text-slate-700 mb-2">
                      Key Competitors
                    </label>
                    <input
                      type="text"
                      id="competitors"
                      name="competitors"
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200"
                      placeholder="competitor1.com, competitor2.com, competitor3.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="marketingGoals" className="block text-sm font-semibold text-slate-700 mb-2">
                      Primary Marketing Goals
                    </label>
                    <select
                      id="marketingGoals"
                      name="marketingGoals"
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 transition-all duration-200"
                    >
                      <option value="">Select your primary goal</option>
                      <option value="brand-awareness">Increase Brand Awareness</option>
                      <option value="lead-generation">Generate More Leads</option>
                      <option value="organic-traffic">Improve Organic Search Traffic</option>
                      <option value="ai-visibility">Improve AI/GEO Visibility</option>
                      <option value="content-strategy">Develop Content Strategy</option>
                      <option value="competitive-edge">Gain Competitive Advantage</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeline" className="block text-sm font-semibold text-slate-700 mb-2">
                      When Are You Looking to Start?
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 transition-all duration-200"
                    >
                      <option value="">Select a timeframe</option>
                      <option value="immediately">Immediately</option>
                      <option value="1-3-months">1-3 months</option>
                      <option value="3-6-months">3-6 months</option>
                      <option value="6-12-months">6-12 months</option>
                      <option value="just-exploring">Just exploring</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="additionalInfo" className="block text-sm font-semibold text-slate-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 text-slate-800 placeholder-slate-400 transition-all duration-200 resize-none"
                      placeholder="Is there anything else you'd like us to know?"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full hover:from-blue-700 hover:to-indigo-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing Your Website...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      Get My Free AI Assessment
                    </>
                  )}
                </button>
                <p className="mt-4 text-sm text-slate-600">
                  We respect your privacy and will never share your information.
                </p>
              </div>
            </form>
          </div>
        </section>

        <footer className="text-center mt-16 py-8 border-t border-slate-200">
          <p className="text-slate-500 mt-2 text-sm">Ready to lead the AI revolution? Let&apos;s build the future of marketing, together.</p>
          <p className="mt-4 text-xs text-slate-400">v1.3.0</p>
        </footer>
      </div>
    </div>
  );
}
