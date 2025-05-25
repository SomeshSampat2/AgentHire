import asyncio
import json
import logging
import re
from typing import Dict, Any, Optional, List
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from app.core.config import settings
from app.models.schemas import LinkedInProfile, GitHubProfile, ProfileEnrichment

logger = logging.getLogger(__name__)


class ScrapingService:
    def __init__(self):
        """Initialize scraping service with configuration"""
        self.timeout = settings.SCRAPING_TIMEOUT
        self.max_retries = settings.MAX_RETRIES
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    async def enrich_profile(
        self,
        linkedin_url: Optional[str] = None,
        github_url: Optional[str] = None,
        portfolio_url: Optional[str] = None
    ) -> ProfileEnrichment:
        """Enrich candidate profile from multiple sources"""
        enrichment = ProfileEnrichment()

        tasks = []
        
        if linkedin_url:
            tasks.append(self._scrape_linkedin_safe(linkedin_url))
        else:
            tasks.append(asyncio.create_task(asyncio.sleep(0, result=None)))

        if github_url:
            tasks.append(self._scrape_github_safe(github_url))
        else:
            tasks.append(asyncio.create_task(asyncio.sleep(0, result=None)))

        if portfolio_url:
            tasks.append(self._scrape_portfolio_safe(portfolio_url))
        else:
            tasks.append(asyncio.create_task(asyncio.sleep(0, result=None)))

        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            linkedin_data, github_data, portfolio_data = results
            
            if linkedin_data and not isinstance(linkedin_data, Exception):
                enrichment.linkedin = linkedin_data
            
            if github_data and not isinstance(github_data, Exception):
                enrichment.github = github_data
                
            if portfolio_data and not isinstance(portfolio_data, Exception):
                enrichment.portfolio = portfolio_data

        except Exception as e:
            logger.error(f"Error in profile enrichment: {str(e)}")

        return enrichment

    async def _scrape_linkedin_safe(self, url: str) -> Optional[LinkedInProfile]:
        """Safely scrape LinkedIn profile with error handling"""
        try:
            return await self._scrape_linkedin(url)
        except Exception as e:
            logger.error(f"LinkedIn scraping failed for {url}: {str(e)}")
            return None

    async def _scrape_github_safe(self, url: str) -> Optional[GitHubProfile]:
        """Safely scrape GitHub profile with error handling"""
        try:
            return await self._scrape_github(url)
        except Exception as e:
            logger.error(f"GitHub scraping failed for {url}: {str(e)}")
            return None

    async def _scrape_portfolio_safe(self, url: str) -> Optional[Dict[str, Any]]:
        """Safely scrape portfolio with error handling"""
        try:
            return await self._scrape_portfolio(url)
        except Exception as e:
            logger.error(f"Portfolio scraping failed for {url}: {str(e)}")
            return None

    async def _scrape_linkedin(self, url: str) -> LinkedInProfile:
        """Scrape LinkedIn profile information"""
        # Note: LinkedIn has aggressive anti-scraping measures
        # This is a simplified version for demonstration
        profile = LinkedInProfile()
        
        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=self.timeout) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"LinkedIn returned status {response.status_code}")
                    return profile

                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract basic info (these selectors are examples and may not work due to LinkedIn's protection)
                # In a real implementation, you'd need to handle LinkedIn's authentication and rate limiting
                
                # Try to extract headline
                headline_elem = soup.find('h2', class_='text-heading-large')
                if headline_elem:
                    profile.headline = headline_elem.get_text(strip=True)
                
                # Extract summary/about section
                about_elem = soup.find('section', {'data-section': 'summary'})
                if about_elem:
                    profile.summary = about_elem.get_text(strip=True)[:500]  # Limit length
                
                # Note: Due to LinkedIn's restrictions, most data extraction would require:
                # 1. LinkedIn API access
                # 2. OAuth authentication
                # 3. Proper rate limiting
                
                logger.info(f"LinkedIn profile scraped (limited data): {url}")

        except Exception as e:
            logger.error(f"Error scraping LinkedIn {url}: {str(e)}")

        return profile

    async def _scrape_github(self, url: str) -> GitHubProfile:
        """Scrape GitHub profile information using GitHub API"""
        try:
            # Extract username from URL
            username = self._extract_github_username(url)
            if not username:
                raise ValueError("Could not extract GitHub username from URL")

            profile = GitHubProfile(username=username)
            
            # Use GitHub API for better data quality and reliability
            api_base = "https://api.github.com"
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Get user profile
                user_response = await client.get(f"{api_base}/users/{username}")
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    profile.name = user_data.get('name')
                    profile.bio = user_data.get('bio')
                    profile.public_repos = user_data.get('public_repos', 0)
                    profile.followers = user_data.get('followers', 0)
                    profile.following = user_data.get('following', 0)

                # Get repositories
                repos_response = await client.get(
                    f"{api_base}/users/{username}/repos",
                    params={'sort': 'updated', 'per_page': 100}
                )
                
                if repos_response.status_code == 200:
                    repos_data = repos_response.json()
                    
                    # Process repositories
                    languages = {}
                    top_repos = []
                    
                    for repo in repos_data[:20]:  # Process top 20 repos
                        repo_info = {
                            'name': repo.get('name'),
                            'description': repo.get('description'),
                            'language': repo.get('language'),
                            'stars': repo.get('stargazers_count', 0),
                            'forks': repo.get('forks_count', 0),
                            'updated_at': repo.get('updated_at'),
                            'url': repo.get('html_url')
                        }
                        
                        profile.repositories.append(repo_info)
                        
                        # Track languages
                        if repo.get('language'):
                            languages[repo['language']] = languages.get(repo['language'], 0) + 1
                        
                        # Identify top repositories (by stars)
                        if repo.get('stargazers_count', 0) > 0:
                            top_repos.append(repo_info)
                    
                    profile.languages = languages
                    profile.top_repositories = sorted(
                        top_repos, 
                        key=lambda x: x['stars'], 
                        reverse=True
                    )[:10]

                # Get contribution stats (simplified)
                profile.contribution_stats = {
                    'total_repos': profile.public_repos,
                    'languages_used': len(profile.languages),
                    'top_language': max(languages.items(), key=lambda x: x[1])[0] if languages else None
                }

                logger.info(f"GitHub profile scraped successfully: {username}")

        except Exception as e:
            logger.error(f"Error scraping GitHub {url}: {str(e)}")
            profile = GitHubProfile(username=username if 'username' in locals() else "unknown")

        return profile

    async def _scrape_portfolio(self, url: str) -> Dict[str, Any]:
        """Scrape portfolio website for relevant information"""
        portfolio_data = {
            'url': url,
            'title': '',
            'description': '',
            'technologies': [],
            'projects': [],
            'contact_info': {},
            'meta_tags': {}
        }

        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=self.timeout) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"Portfolio returned status {response.status_code}")
                    return portfolio_data

                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract title
                title_elem = soup.find('title')
                if title_elem:
                    portfolio_data['title'] = title_elem.get_text(strip=True)
                
                # Extract meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                if meta_desc:
                    portfolio_data['description'] = meta_desc.get('content', '')
                
                # Extract technologies from common patterns
                technologies = set()
                
                # Look for technology keywords in text
                tech_keywords = [
                    'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node',
                    'django', 'flask', 'spring', 'docker', 'kubernetes', 'aws', 'azure',
                    'mongodb', 'postgresql', 'mysql', 'redis', 'tensorflow', 'pytorch',
                    'git', 'jenkins', 'terraform', 'html', 'css', 'typescript', 'go',
                    'rust', 'php', 'ruby', 'rails', 'laravel', 'express', 'fastapi'
                ]
                
                page_text = soup.get_text().lower()
                for tech in tech_keywords:
                    if tech in page_text:
                        technologies.add(tech.title())
                
                portfolio_data['technologies'] = list(technologies)
                
                # Look for project sections
                project_sections = soup.find_all(['section', 'div'], 
                                               class_=re.compile(r'project|portfolio|work', re.I))
                
                projects = []
                for section in project_sections[:5]:  # Limit to first 5 project sections
                    project_title = section.find(['h1', 'h2', 'h3', 'h4'])
                    if project_title:
                        project_description = section.get_text(strip=True)[:200]  # Limit length
                        projects.append({
                            'title': project_title.get_text(strip=True),
                            'description': project_description
                        })
                
                portfolio_data['projects'] = projects
                
                # Extract contact information
                contact_info = {}
                
                # Look for email
                email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                emails = re.findall(email_pattern, page_text)
                if emails:
                    contact_info['email'] = emails[0]
                
                # Look for social links
                social_links = {}
                for link in soup.find_all('a', href=True):
                    href = link['href'].lower()
                    if 'linkedin.com' in href:
                        social_links['linkedin'] = link['href']
                    elif 'github.com' in href:
                        social_links['github'] = link['href']
                    elif 'twitter.com' in href:
                        social_links['twitter'] = link['href']
                
                contact_info['social_links'] = social_links
                portfolio_data['contact_info'] = contact_info
                
                # Extract relevant meta tags
                meta_tags = {}
                for meta in soup.find_all('meta'):
                    if meta.get('property'):
                        meta_tags[meta['property']] = meta.get('content', '')
                    elif meta.get('name'):
                        meta_tags[meta['name']] = meta.get('content', '')
                
                portfolio_data['meta_tags'] = meta_tags
                
                logger.info(f"Portfolio scraped successfully: {url}")

        except Exception as e:
            logger.error(f"Error scraping portfolio {url}: {str(e)}")

        return portfolio_data

    def _extract_github_username(self, url: str) -> Optional[str]:
        """Extract GitHub username from URL"""
        try:
            parsed = urlparse(url)
            if 'github.com' not in parsed.netloc:
                return None
            
            path_parts = [p for p in parsed.path.split('/') if p]
            if path_parts:
                return path_parts[0]
            
            return None
        except Exception as e:
            logger.error(f"Error extracting GitHub username from {url}: {str(e)}")
            return None

    def _is_valid_url(self, url: str) -> bool:
        """Validate URL format"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False


# Global service instance
scraping_service = ScrapingService() 